import { useNavigate } from "react-router-dom";
import { useState, useEffect} from "react";
import axios from "axios";
const TopicRoom = (props) => {
    const [isWide, setIsWide] = useState(window.matchMedia("(min-width: 640px)").matches);
    const [isLeft, setIsLeft] = useState('true');
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [topic, setTopic] = useState('');
    const [cons, setCons] = useState(0);
    const [pros, setPros] = useState(0);
    const [period, setPeriod] = useState(0);
    const [date, setDate] = useState(0);
    const [chatSocket, setChatSocket] = useState(null);
    const navigate = useNavigate();
    const [kakaoId, setKakaoId] = useState(null);
    const topicId = new URL(window.location.href).searchParams.get("topic");
    const [message, setMessage] = useState('');


    const proBarStyle = {
        width: pros == 0 ? '0%' : ((pros / (pros+cons) * 100).toFixed(2))+ '%'
    }

    const conBarStyle = {
        width: cons == 0 ? '0%' : ((cons / (pros+cons) * 100).toFixed(2))+ '%'
    }

    const handleBackButton = () =>{
        navigate("/");
    }

    const handleStart = (x) =>{
        setStartX(x);
        setIsDragging(true);
    }

    const handleMove = (x) =>{
        if(!isDragging) return;

        const diffX = x - startX;
        if(diffX < -50 && !isWide){
            setIsLeft(false);
            setIsDragging(false);
        }
        else if(diffX > 50 && !isWide){
            setIsLeft(true);
            setIsDragging(false);
        }
    }
    axios.defaults.withCredentials = true;
    
    useEffect(() => {
        //입장시 방 정보 가져오는
        const fetchRoom = async () => {
            try {
                const response = await fetch(process.env.REACT_APP_DEFAULT_URL+"/api/getRoomInfo?topic=" + topicId);
                if (!response.ok) {
                    console.log('error!');
                }
                const data = await response.json();
                console.log(data);
                const room = JSON.parse(data);
                setTopic(room[0].fields.topic);
                setCons(room[0].fields.cons);
                setPros(room[0].fields.pros);
                setPeriod(room[0].fields.period);
                setDate(room[0].fields.created_at);
                setKakaoId(localStorage.getItem('kakaoId'));
                } catch (error) {
                    console.error("Fetching data failed", error);
                }
            };
            fetchRoom();
    }, [props.history]);

    useEffect(() => {
        //브라우저 사이즈 브레이크포인트
        const handleResize = (e) => {
            setIsWide(e.matches);
            if(!isWide){
                setIsLeft(true);
            }
        };
        const breakpoint = window.matchMedia("(min-width: 640px)");
        breakpoint.addListener(handleResize);

        return () => breakpoint.removeListener(handleResize);
    }, []);

    useEffect(()=>{
        //스와이프
        const handleTouchStart = (e) => handleStart(e.touches[0].clientX);
        const handleTouchMove = (e) => handleMove(e.touches[0].clientX);
        const handleMouseDown = (e) => handleStart(e.clientX);
        const handleMouseMove = (e) => handleMove(e.clientX);
        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startX, isWide]);
    
    useEffect(() => {
        //웹소켓
        const newChatSocket = new WebSocket(
            'ws://127.0.0.1:8000/ws/chat/' + topicId + '/'
        );

        newChatSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if(data.type == 'VOTE'){
                if(data.isPro){
                    setPros(prevPros => prevPros+1);
                }
                else if(!data.isPro){
                    setCons(prevCons => prevCons+1);
                }
            }
            else if(data.type == 'MSG'){
                console.log(data);
            }
        };

        newChatSocket.onclose = (e) => {
            console.error('Chat socket closed unexpectedly');
        };

        setChatSocket(newChatSocket);

        return () => {
            newChatSocket.close();
        };
    }, []);


    const sendMessage = () => {
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify({ 'type': 'MSG', 'message': message, 'kakaoId': kakaoId }));
        } else {
            console.error("WebSocket is not open.");
        }
        setMessage('');
    };

    const sendVote = (isPro) => {
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify({ 'type': 'VOTE', 'isPro': isPro, 'kakaoId': kakaoId }));
        } else {
            console.error("WebSocket is not open.");
        }
    };

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    }

    const enterPress = (event) => {
        if(event.key === 'Enter'){
            sendMessage();
        }
    }


    return (
        <div className="bg-zinc-900">
            <div id="alertModal" className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div className="mt-3 text-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="alertModalTitle">
                            Warning!
                        </h3>
                        <div className="mt-2 px-7 py-3">
                            <p className="text-sm text-gray-500" id="alertModalBody">
                                Something went wrong.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="left-10 justify-start absolute top-4 z-50">
                <div className="flex items-center justify-start rounded">
                    <button className="bg-gray-700 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
                        onClick={handleBackButton}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left-circle" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div className="w-11/12 h-5/6 rounded-3xl p-10 ">
                <div
                    className="h-1/2 w-3/4 flex flex-col justify-center fixed bg-zinc-900 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                    <div className="font-bold mb-4 flex justify-center text-white whitespace-nowrap">
                        {topic}
                    </div>
                    <div className="w-full flex justify-center">
                        <div className="pro text-white h-10 w-10 table-cell text-center text-sm rounded-3xl hover:cursor-pointer"
                            onClick={()=>sendVote(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-hand-thumbs-up" viewBox="0 0 20 20">
                                <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.224 2.224 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.866.866 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>
                            </svg></div>
                        <div className="proPercentage mx-3 font-bold w-14 text-center text-white">{pros == 0 ? '0%' : ((pros / (pros+cons) * 100).toFixed(2))+ '%'}
                        </div>
                        <div className="w-1/2 h-5 rounded-lg bg-gray-300 flex">
                            <div className={"proGage h-full bg-yellow-300 rounded-l-lg text-center" + (cons == 0 ? ' rounded-r-lg' : '')} style={proBarStyle}
                                //th:style="'width:'+${view_pro_rate}+'%'"
                                //th:classappend="${view_pro_rate == '100.0'}? 'rounded-r-lg' : ''" style="width: 54.27%;"
                                ></div>
                            <div className={"conGage h-full bg-blue-400 rounded-r-lg text-center" + (pros == 0 ? ' rounded-l-lg' : '')} style={conBarStyle}
                                //th:style="'width:'+${view_con_rate}+'%'"
                                //th:classappend="${view_con_rate == '100.0'}? 'rounded-l-lg' : ''" style="width: 45.73%;"
                                ></div>
                        </div>
                        <div className="conPercentage mx-3 font-bold w-14 text-center text-white">{cons == 0 ? '0%' : ((cons / (pros+cons) * 100).toFixed(2))+ '%'}
                        </div>
                        <div className="con text-white h-10 w-10 table-cell text-center text-sm rounded-3xl hover:cursor-pointer"
                            onClick={()=>sendVote(false)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-hand-thumbs-down" viewBox="0 0 20 20">
                                <path d="M8.864 15.674c-.956.24-1.843-.484-1.908-1.42-.072-1.05-.23-2.015-.428-2.59-.125-.36-.479-1.012-1.04-1.638-.557-.624-1.282-1.179-2.131-1.41C2.685 8.432 2 7.85 2 7V3c0-.845.682-1.464 1.448-1.546 1.07-.113 1.564-.415 2.068-.723l.048-.029c.272-.166.578-.349.97-.484C6.931.08 7.395 0 8 0h3.5c.937 0 1.599.478 1.934 1.064.164.287.254.607.254.913 0 .152-.023.312-.077.464.201.262.38.577.488.9.11.33.172.762.004 1.15.069.13.12.268.159.403.077.27.113.567.113.856 0 .289-.036.586-.113.856-.035.12-.08.244-.138.363.394.571.418 1.2.234 1.733-.206.592-.682 1.1-1.2 1.272-.847.283-1.803.276-2.516.211a9.877 9.877 0 0 1-.443-.05 9.364 9.364 0 0 1-.062 4.51c-.138.508-.55.848-1.012.964l-.261.065zM11.5 1H8c-.51 0-.863.068-1.14.163-.281.097-.506.229-.776.393l-.04.025c-.555.338-1.198.73-2.49.868-.333.035-.554.29-.554.55V7c0 .255.226.543.62.65 1.095.3 1.977.997 2.614 1.709.635.71 1.064 1.475 1.238 1.977.243.7.407 1.768.482 2.85.025.362.36.595.667.518l.262-.065c.16-.04.258-.144.288-.255a8.34 8.34 0 0 0-.145-4.726.5.5 0 0 1 .595-.643h.003l.014.004.058.013a8.912 8.912 0 0 0 1.036.157c.663.06 1.457.054 2.11-.163.175-.059.45-.301.57-.651.107-.308.087-.67-.266-1.021L12.793 7l.353-.354c.043-.042.105-.14.154-.315.048-.167.075-.37.075-.581 0-.211-.027-.414-.075-.581-.05-.174-.111-.273-.154-.315l-.353-.354.353-.354c.047-.047.109-.176.005-.488a2.224 2.224 0 0 0-.505-.804l-.353-.354.353-.354c.006-.005.041-.05.041-.17a.866.866 0 0 0-.121-.415C12.4 1.272 12.063 1 11.5 1z"/>
                            </svg></div>
                    </div>
                    {isWide ? 
                    <div className="labelDiv w-full text-2xl font-bold w-20 flex justify-around"><span className="text-gray-500">찬성</span> <span className="text-gray-500">반대</span></div>
                     : 
                     (isLeft ? 
                        <div className="labelDiv w-full text-2xl font-bold w-20 flex justify-around"><span className="text-gray-500">찬성</span></div>
 
                        : 
                        <div className="labelDiv w-full text-2xl font-bold w-20 flex justify-around"><span className="text-gray-500">반대</span></div>

                        )
                    }



                    <div className="flex h-full w-[200%] sm:w-full">
                        <div className={"h-full flex-1 overflow-y-auto p-4 border-4 border-solid border-gray-500 rounded-xl duration-500 ease-in-out w-full " + (isWide ? '' : ('section transition-transform ' + (isLeft ? ' ' : ' -translate-x-double')))}
                            id="sectionA">
                            <div className="flex flex-col space-y-2 msgProContainer">
                                
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            최0현
                                        </div>
                                        내같은 기운을 가진 놈은 짬뽕을 먹었어야 맞는긴데~~ 꼬이따~ 꼬이써~~
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-26 23:25:17
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            이0구
                                        </div>
                                        거 짬뽕먹기 딱 좋은 날씨네
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-26 23:49:06
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            오0남
                                        </div>
                                        제발 그만해~~ 나 짬뽕먹고 싶어~~
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-26 23:55:48
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            강0중
                                        </div>
                                        난 짬뽕 먹을 때 이 놈이 세상 마지막 짬뽕이라는 생각으로 먹는다...
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-27 00:21:59
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            전0환
                                        </div>
                                        짜장은 사탄의 가래같은거고
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-27 00:27:31
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            전0환
                                        </div>
                                        짬뽕은 주님의 은총이야
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-27 00:27:39
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="w-1 max-h-full bg-black rounded-lg mx-10 hidden sm:block">

                        </div>
                        <div className={"h-full flex-1 overflow-y-auto p-4 border-4 border-solid border-gray-500 rounded-xl " + (isWide ? '' : ('section transition-transform duration-500 ease-in-out transform ' + (isLeft ? ' translate-x-full' : ' -translate-x-full')))}
                            id="sectionB">
                            <div className="flex flex-col space-y-2 msgConContainer">
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            톤0칠
                                        </div>
                                        악!!! 제가 만든 신작 오도기합 짜세넘치는 해병짜장의 시식을 부탁드려도 되는지 여쭤봐도 되는지 확인할 수 있는지를 질문드려도 되는지에 대한 의견을 여쭈어도 되는지 궁금합니다!!!!
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-26 20:07:04
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            곽0팔
                                        </div>
                                        나 뉴진스 민지인데 비추준다
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-26 20:47:31
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            김0붕
                                        </div>
                                        확실히 짜장면을 먹고 나서 내 인생이 달라졌다.
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-26 21:05:42
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            신0오
                                        </div>
                                        이걸 보니 새삼 중화요리 초창기부터 지금까지 현역으로 달려온 짜장면이 대단하다고 느껴지네...
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-26 21:23:30
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                                        <div className="text-sm align-text-bottom text-left">
                                            이0오
                                        </div>
                                        솔직히 짜장 안먹는 애들이 음식이 뭔지나 알겠냐
                                        <div className="text-sm w-full align-text-bottom text-right">
                                            2023-11-26 21:51:21
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>
                    <div className=" p-4 flex items-center">
                        <input type="text" placeholder="여러분의 의견을 말해주세요"
                            className="msgInput flex-1 border rounded-full px-4 py-2 focus:outline-none" value={message} onChange={handleMessageChange} onKeyDown={enterPress}/>
                        <button className="bg-gray-700 text-white rounded-full p-2 ml-2 hover:bg-blue-600 focus:outline-none"
                            onClick={()=>sendMessage()}>
                            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                stroke="#ffffff">
                                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path
                                        d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z"
                                        stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                </g>
                            </svg>
                        </button>
                    </div>
                    <div className="flex justify-center">
                        <span className="text-gray-400 text-sm">모바일에서는 화면을 좌우로 스와이프 해주세요!</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

const message = (props) => {
    return (
        <div className="flex">
            <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                <div className="text-sm align-text-bottom text-left">
                    최0현
                </div>
                내같은 기운을 가진 놈은 짬뽕을 먹었어야 맞는긴데~~ 꼬이따~ 꼬이써~~
                <div className="text-sm w-full align-text-bottom text-right">
                    2023-11-26 23:25:17
                </div>
            </div>
        </div>
    )
}

export default TopicRoom;