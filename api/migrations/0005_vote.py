# Generated by Django 4.2.7 on 2023-12-11 14:30

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_rename_con_roominformation_cons_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Vote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('isPro', models.BooleanField()),
                ('nickname', models.CharField(max_length=100)),
                ('kakao_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to=settings.AUTH_USER_MODEL)),
                ('roomId', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='api.roominformation')),
            ],
        ),
    ]
