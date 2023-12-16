from django.http import JsonResponse, HttpResponse
import requests, os, jwt, datetime, json
from .models import CustomUser, RoomInformation, Message
from django.contrib.auth import login, logout
from django.core import serializers

def auth_kakao(request):
    if request.method == 'GET':
        try:
            code = request.GET['code']
            kakaoToken = requests.post(
                "https://kauth.kakao.com/oauth/token",
                headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
                data={
                    "grant_type": "authorization_code",
                    "client_id": str(os.getenv('CLIENT_ID')),
                    "redirect_uri": str(os.getenv('REDIRECT_URI')),
                    "code": code
                },
            )
            kakaoToken = kakaoToken.json().get("access_token")
            print("kakao Token", kakaoToken)
            userData = requests.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={
                         "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
                         "Authorization": f"Bearer {kakaoToken}"
                },
            )
            userData = userData.json()
            kakao_account = userData.get("kakao_account")
            print(kakao_account)

            if kakao_account is not None:
                user, created = CustomUser.objects.get_or_create(
                    kakao_id=userData.get("id"),
                    defaults={
                        'nickname': kakao_account.get("profile").get("nickname"),
                        'profileImageUrl': kakao_account.get("profile").get("profile_image_url")
                    }
                )
                login(request, user)
                jwt_token = jwt.encode({'kakao_id': userData.get("id"), 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, str(os.getenv('CLIENT_ID')), algorithm=str(os.getenv('ALGORITHM')))
                result = {
                    'kakaoId': userData.get("id"),
                    'nickname': kakao_account.get("profile").get("nickname"),
                    'profileImageUrl': kakao_account.get("profile").get("profile_image_url"),
                    'token': jwt_token,
                    'isAdmin': user.is_admin,
                }
                print('admin?', user.is_admin)
                return JsonResponse(result)
        except Exception as e:
            print(e)
            return JsonResponse({'success': 'fail'})

        return
    else:
        print(request.method)
        return JsonResponse({'success': 'fail'})

def auth_logout(request):
    logout(request)
    return JsonResponse({'result': 'success'})

def create_topic(request):
    if request.method == 'POST':
        try:
            token = getTokenFromHeader(request)
            token = checkToken(token)
            if token is None:
                print('token')
                return JsonResponse({'success': False, 'msg': 'Token is invalid'})
            print(token)
            if checkAdmin(token['kakao_id']) is not True:
                print('no admin')
                return JsonResponse({'success': False, 'msg': 'You are not admin'})

            data = json.loads(request.body)
            print('post: ', data.get('topic'))
            topic = data.get('topic')
            period = data.get('period')
            print('hello', topic, period)
            RoomInformation.objects.create(
                topic=topic,
                period=period
            )
            return JsonResponse({'success': True})
        except Exception as e:
            print('error', e)
            return JsonResponse({'success': False})
    else:
        return JsonResponse({'success': 'false', 'msg': 'invalid access'})

def getRoomInfoAll(request):
    if request.method == 'GET':
        rooms = RoomInformation.objects.all().order_by('-created_at')
        data = serializers.serialize('json', rooms)
        print(data)

        return JsonResponse(data, safe=False)

def getRoomInfo(request):
    if request.method == 'GET':
        try:
            topic = request.GET.get('topic', '').replace('-', '')
            room = RoomInformation.objects.get(roomId=topic)
            print(room)
            data = serializers.serialize('json', [room])
            return JsonResponse(data, safe=False)
        except Exception as e:
            print(e)
            return JsonResponse({'error': 'fail!'})

def getInitMsg(request):
    if request.method == 'GET':
        try:
            topic = request.GET.get('topic', '').replace('-', '')
            proMsg = Message.objects.filter(roomId_id=topic, isPro=True).order_by('-created_at')[:30]
            conMsg = Message.objects.filter(roomId_id=topic, isPro=False).order_by('-created_at')[:30]
            proData = serializers.serialize('json', proMsg)
            conData = serializers.serialize('json', conMsg)
            data = {'proMsg': proData, 'conMsg': conData}
            return JsonResponse(data, safe=False)
        except Exception as e:
            print(e)
            return JsonResponse({'error': 'fail!'})

def getMsg(request):
    try:
        topic = request.GET.get('topic', '').replace('-', '')
        isPro = bool(request.GET.get('isPro', ''))
        start = int(request.GET.get('start', ''))
        if isPro:
            msg = Message.objects.filter(roomId_id=topic, isPro=True).order_by('-created_at')[start:start+30]
            data = serializers.serialize('json', msg)
            return JsonResponse(data, safe=False)
        else:
            msg = Message.objects.filter(roomId_id=topic, isPro=False).order_by('-created_at')[start:start+30]
            data = serializers.serialize('json', msg)
            return JsonResponse(data, safe=False)

    except Exception as e:
        print(e)
        return JsonResponse({'error': 'fail!'})

def getUserInfo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = CustomUser.objects.get(kakao_id=data.get('kakaoId'))
            suser = serializers.serialize('json', user)
            return JsonResponse({'success': 'success', 'data': suser})
        except Exception as e:
            return JsonResponse({'success': 'fail', 'error': e})


def getTokenFromHeader(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None

def checkToken(token):
    try:
        decoded = jwt.decode(token, str(os.getenv('CLIENT_ID')), algorithms=str(os.getenv('ALGORITHM')))
        return decoded
    except Exception as e:
        print(e)
        return None

def checkAdmin(id):
    user = CustomUser.objects.get(kakao_id=id)
    print('isAdmin: ' + str(user.is_admin))
    return user.is_admin
