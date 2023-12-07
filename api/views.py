from django.http import JsonResponse, HttpResponse
import requests, os
from dotenv import load_dotenv

def login_kakao(request):
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
        except:
            print('eng??')

        return JsonResponse({'success':'sucess'})
    else:
        print(request.method)
        return JsonResponse({'success':'fail'})