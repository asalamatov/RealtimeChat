import json
import base64

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.files.base import ContentFile

from .serializers import UserSerializer



class ChatConsumer(WebsocketConsumer):

    def connect(self):  # it is async
        user = self.scope['user']
        print(user, user.is_authenticated)
        if not user.is_authenticated:
            return
        # save username to use as a group name for this user
        self.username = user.username
        # join this user to a group with their username
        async_to_sync(self.channel_layer.group_add)(
            self.username,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        # leave room/group
        async_to_sync(self.channel_layer.group_discard)(
            self.username,
            self.channel_name
        )

    # ------------------
    # Handle Requests
    # ------------------

    def receive(self, text_data):
        # receive data from WebSocket
        data = json.loads(text_data)
        data_source = data.get('source')

        # pretty print data received from WebSocket
        print('receive', json.dumps(data, indent=2))

        # Thubmnail upload
        if data_source == 'thumbnail':
            self.receive_thumbnail(data)



    def receive_thumbnail(self, data):
        user = self.scope['user']
        # convert base64 string to django content file
        image_str = data.get('base64')
        image = ContentFile(base64.b64decode(image_str))
        # update thumbnail field
        filename = data.get('filename')
        user.thumbnail.save(filename, image, save=True)
        #serialize user
        serialized = UserSerializer(user)
        # Send updated user data including thumbnail to group
        self.send_group(self.username, 'thumbnail', serialized.data)

    # ------------------
    # Catch all broadcast to client helpers
    # ------------------

    def send_group(self, group, source, data):

        # send data to group
        response = {
            'type': 'broadcast_group',
            'source': source,
            'data': data
        }
        async_to_sync(self.channel_layer.group_send)(
            group,
            response
        )


    def broadcast_group(self, data):
        '''
            data:
            -type: 'broadcast_group'
            -source: 'thumbnail'   # where it came from
            -data: whatever data you want to send as a dict
        '''
        data.pop('type')
        '''
            return data:
            -source: 'thumbnail'   # where it came from
            -data: whatever data you want to send as a dict
        '''
        self.send(text_data=json.dumps(data))



