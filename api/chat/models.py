from django.contrib.auth.models import AbstractUser
from django.db import models


def upload_thumbnail(instance, filename):
  path = f'thumbnails/{instance.username}'
  extension = filename.split('.')[-1]
  if extension:
    path = path + '.' + extension
  return path


class User(AbstractUser):
  thumbnail = models.ImageField(
    upload_to=upload_thumbnail,
    null=True,
    blank=True
  )


class Connection(models.Model):
  sender = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
    related_name='sent_connections'
  )
  receiver = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
    related_name='received_connections'
  )
  accepted = models.BooleanField(default=False)
  update = models.DateTimeField(auto_now=True)
  created = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f'{self.sender.username} to {self.receiver.username}'
