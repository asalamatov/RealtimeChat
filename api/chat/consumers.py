import json
import base64

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.files.base import ContentFile
from django.db.models import Q, Exists, OuterRef

from .models import User, Connection
from .serializers import SearchSerializer, UserSerializer, RequestSerializer




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
            self.username, self.channel_name
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

        # Accept friend request
        if data_source == 'request.accept':
            self.receive_request_accept(data)

        # Make friend request
        if data_source == 'request.list':
            self.receive_request_list(data)

        # Search / filter users
        elif data_source == 'request.connect':
            self.receive_request_connect(data)

        # Search / filter users
        elif data_source == 'search':
            self.receive_search(data)

        # Thubmnail upload
        elif data_source == 'thumbnail':
            self.receive_thumbnail(data)


# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    def receive_request_accept(self, data):
        # get connection to accept
        username = data.get('username')
        # Fetch connection object
        try:
          connection = Connection.objects.get(
            sender__username=username,
            receiver=self.scope['user']
          )
        except Connection.DoesNotExist:
            print('ERROR: Connection does not exist')
            return
        # Update the connection
        connection.accepted = True
        connection.save()

        # serialize connection
        serialized = RequestSerializer(connection)
        # send back to sender
        self.send_group(connection.sender.username, 'request.accept', serialized.data)
        # send to receiver
        self.send_group(connection.receiver.username, 'request.accept', serialized.data)
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    def receive_request_list(self, data):
        user = self.scope['user']
        # get all connections for this user
        connections = Connection.objects.filter(
          receiver=user,
          accepted=False
        )
        # serialize connections
        serialized = RequestSerializer(connections, many=True)
        # send back to client
        self.send_group(self.username, 'request.list', serialized.data)


    def receive_request_connect(self, data):
        # get user to connect to
        username = data.get('username')
        # get user object
        try:
          receiver = User.objects.get(username=username)
        except User.DoesNotExist:
            print('ERROR: User does not exist')
            return
        # create Connection
        connection, _ = Connection.objects.get_or_create(
            sender=self.scope['user'],
            receiver=receiver
        )
        # serialize user
        serialized = RequestSerializer(connection)
        # send back to sender
        self.send_group(connection.sender.username, 'request.connect', serialized.data)
        # send to receiver
        self.send_group(connection.receiver.username, 'request.connect', serialized.data)


    def receive_search(self, data):
        query = data.get('query')
        # get users that match query
        users = User.objects.filter(
            Q(username__icontains=query)    |
            Q(username__istartswith=query)  |
            Q(first_name__istartswith=query) |
            Q(first_name__icontains=query)    |
            Q(last_name__istartswith=query)  |
            Q(last_name__icontains=query)
        ).exclude(
            username=self.username
        ).annotate(
            pending_them=Exists(
                Connection.objects.filter(
                    sender = self.scope['user'],
                    receiver=OuterRef('id'),
                    accepted=False
                )
            ),
            pending_me=Exists(
                Connection.objects.filter(
                    sender = OuterRef('id'),
                    receiver=self.scope['user'],
                    accepted=False
                )
            ),
            connected=Exists(
                Connection.objects.filter(
                    Q(sender=self.scope['user'], receiver=OuterRef('id')) |
                    Q(receiver=OuterRef('id'), sender=self.scope['user']),
                    accepted=True
                )
            )
        )

        # serialize users
        serialized = SearchSerializer(users, many=True)
        # send search results back to client
        self.send_group(self.username, 'search', serialized.data)

    def receive_thumbnail(self, data):
        user = self.scope['user']
        # convert base64 string to django content file
        image_str = data.get('base64')
        image = ContentFile(base64.b64decode(image_str))
        # update thumbnail field
        filename = data.get('filename')
        user.thumbnail.save(filename, image, save=True)        # updating the database
        #serialize user
        serialized = UserSerializer(user)
        # Send updated user data including thumbnail to group
        self.send_group(self.username, 'thumbnail', serialized.data)

    # --------------------------------------------
    # Catch all broadcast to client helpers
    # --------------------------------------------

    def send_group(self, group, source, data):     # username == group????

        # send data to group
        response = {
            'type': 'broadcast_group',
            'source': source,
            'data': data
        }
        async_to_sync(self.channel_layer.group_send)(
            group, response
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



