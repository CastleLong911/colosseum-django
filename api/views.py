from django.http import JsonResponse, HttpResponse
import requests, os, jwt, datetime
from .models import CustomUser
from django.contrib.auth import login, logout
from dotenv import load_dotenv

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
                    'token': jwt_token
                }
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