from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

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