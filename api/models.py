import uuid

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, kakao_id, nickname, profileImageUrl, password=None, **extra_fields):
        user = self.model(kakao_id=kakao_id, nickname=nickname, profileImageUrl=profileImageUrl, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class CustomUser(AbstractBaseUser, PermissionsMixin):
    kakao_id = models.CharField(max_length=255, unique=True)
    nickname = models.CharField(max_length=255)
    profileImageUrl = models.URLField()
    is_admin = models.BooleanField(default=False)

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
    kakao_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='votes')
    nickname = models.CharField(max_length=100)

    def save(self, *args, **kwargs):
        if not self.nickname:
            self.nickname = self.kakao_id.nickname
        super().save(*args, **kwargs)