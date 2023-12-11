import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class ChatConsumer(WebsocketConsumer):
    def connect(self):

        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        type = text_data_json['type']
        sender = text_data_json['kakaoId']
        if type == 'VOTE':
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'VOTE',
                    'isPro': text_data_json['isPro'],
                    'sender': sender
                }
            )
        elif type == 'MSG':
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'MSG',
                    'message': text_data_json['message'],
                    'sender': sender
                }
            )

    def MSG(self, event):
        # Receive message from room group
        text = event['message']
        sender = event['sender']
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'MSG',
            'text': text,
            'sender': sender
        }))
    def VOTE(self, event):
        isPro = event['isPro']
        sender = event['sender']
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'VOTE',
            'isPro': isPro,
            'sender': sender
        }))