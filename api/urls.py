from django.contrib import admin
from django.urls import path
from . import views
urlpatterns = [
    path('login/kakao', views.auth_kakao, name='kakaoLogin'),
    path('logout', views.auth_logout, name='logout'),
    path('createTopic', views.create_topic, name='createTopic'),
    path('getRoomInfoAll', views.getRoomInfoAll, name='getRoomInfoAll')
]