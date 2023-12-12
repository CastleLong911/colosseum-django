import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import Vote, CustomUser, Message


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
        room_id = str(self.room_name).replace('-', '')
        if type == 'VOTE':
            print(self.room_name)
            if Vote.objects.filter(roomId_id=room_id, kakao_id_id=sender).exists():
                self.send(text_data=json.dumps({
                    'type': 'ERR',
                    'message': '이미 투표하셨습니다.'
                }))
            else:
                vote = Vote(
                    isPro=text_data_json['isPro'],
                    kakao_id_id=sender,
                    roomId_id=room_id
                )
                print(text_data_json['isPro'], sender, room_id)
                vote.save()
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'VOTE',
                        'isPro': text_data_json['isPro'],
                        'sender': sender
                    }
                )
        elif type == 'MSG':
            if Vote.objects.filter(roomId_id=room_id, kakao_id_id=sender).exists():
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'MSG',
                        'room_id': room_id,
                        'message': text_data_json['message'],
                        'nickname': mask_name(str(CustomUser.objects.get(kakao_id=sender).nickname)),
                        'isPro': Vote.objects.get(roomId_id=room_id, kakao_id_id=sender).isPro,
                        'sender': sender
                    }
                )
            else:
                self.send(text_data=json.dumps({
                    'type': 'ERR',
                    'message': '투표를 먼저 해주세요'
                }))

    def MSG(self, event):
        # Receive message from room group
        message = event['message']
        sender = event['sender']
        nickname = event['nickname']
        isPro = event['isPro']
        room_id = event['room_id']
        # Send message to WebSocket
        msg = Message(
            isPro=isPro,
            nickname=nickname,
            kakao_id_id=sender,
            roomId_id=room_id,
            message=message
        )
        msg.save()
        self.send(text_data=json.dumps({
            'type': 'MSG',
            'isPro': isPro,
            'message': message,
            'sender': sender,
            'nickname': nickname,
            'date': str(msg.created_at)[:16]
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

def mask_name(name):
    if len(name) == 1:
        return "O"
    elif len(name) == 2:
        return name[0] + "O"
    else:
        return name[0] + ("O" * (len(name) - 2)) + name[-1]