from django.contrib import admin
from django.urls import path
from . import views
urlpatterns = [
    path('login/kakao', views.auth_kakao),
    path('login/logout', views.auth_logout),
]