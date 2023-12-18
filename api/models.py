import uuid

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

def get_default_user():
    return CustomUser.objects.get_or_create(kakao_id='default', defaults={'nickname': '탈퇴한 유저'})[0]

class CustomUserManager(BaseUserManager):
    def create_user(self, kakao_id, nickname, profileImageUrl, password=None, **extra_fields):
        user = self.model(kakao_id=kakao_id, nickname=nickname, profileImageUrl=profileImageUrl, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class CustomUser(AbstractBaseUser, PermissionsMixin):
    kakao_id = models.CharField(max_length=255, unique=True, primary_key=True, default='탈퇴한유저')
    nickname = models.CharField(max_length=255)
    profileImageUrl = models.URLField()
    is_admin = models.BooleanField(default=False)
    nor = models.IntegerField(default=0)
    nov = models.IntegerField(default=0)
    objects = CustomUserManager()

    USERNAME_FIELD = 'kakao_id'
    REQUIRED_FIELDS = ['nickname', 'profileImageUrl']

    def __str__(self):
        return self.kakao_id

class RoomInformation(models.Model):
    roomId = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    pros = models.IntegerField(default=0)
    cons = models.IntegerField(default=0)
    topic = models.CharField(max_length=200)
    period = models.IntegerField(default=7)
    replies = models.IntegerField(default=0)

    def __str__(self):
        return self.topic

class Vote(models.Model):
    roomId = models.ForeignKey(RoomInformation, on_delete=models.CASCADE, related_name='votes')
    isPro = models.BooleanField()
    kakao_id = models.ForeignKey(CustomUser, on_delete=models.SET(get_default_user), related_name='votes')
    nickname = models.CharField(max_length=100)

    def save(self, *args, **kwargs):
        creating = self._state.adding
        if not self.nickname:
            self.nickname = self.kakao_id.nickname
        super().save(*args, **kwargs)
        if creating:
            CustomUser.objects.filter(kakao_id=self.kakao_id).update(nov=models.F('nov') + 1)


class Message(models.Model):
    roomId = models.ForeignKey(RoomInformation, on_delete=models.CASCADE, related_name='messages')
    isPro = models.BooleanField()
    kakao_id = models.ForeignKey(CustomUser, on_delete=models.SET(get_default_user), related_name='messages')
    nickname = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    message = models.CharField(max_length=255, default='')

    def save(self, *args, **kwargs):
        creating = self._state.adding
        super().save(*args, **kwargs)
        if creating:
            CustomUser.objects.filter(kakao_id=self.kakao_id).update(nor=models.F('nor') + 1)