from django.contrib import admin
from .models import User, Connection

admin.site.register(User)
admin.site.register(Connection)