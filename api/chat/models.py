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
  updated = models.DateTimeField(auto_now=True)      # auto_now=True means that the field will be updated every time the model is saved
  created = models.DateTimeField(auto_now_add=True)  # auto_now_add=True means that the field will be set to now every time the model is created

  def __str__(self):
    return f'{self.sender.username} to {self.receiver.username}'


class Message(models.Model):
    connection = models.ForeignKey(
        Connection,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='my_messages'
    )
    text = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} sent {self.text}'