import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import data from './data'; //백엔드 연결시 지우셈
import { KAKAO_AUTH_URL } from './OAuth';
import {Routes, Route, Link, useNavigate} from 'react-router-dom';
import LoginHandler from './loginHandler';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from './csrftoken';
import TopicRoom from './topicRoom';

function App() {

  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<Main/>}></Route>
        <Route path="/social/login/kakao" element={<LoginHandler/>}></Route>
        <Route path="/room" element={<TopicRoom/>}></Route>
      </Routes>
    </div>
  );
}

function Main(){
  let [dark, isDark] = useState(false);
  let [open, isOpen] = useState(false);
  let [modalData, setModalData] = useState({});
  let [login, isLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  let [nickname, setNickname] = useState('');
  let [kakaoId, setKakaoId] = useState('');
  let [profileImageUrl, setProfileImageUrl] = useState('');
  let [isAdmin, setIsAdmin] = useState(false);
  let [newTopic, setNewTopic] = useState('');
  let [newPeriod, setNewPeriod] = useState();
  let [nor, setNor] = useState(0);
  let [nov, setNov] = useState(0);
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    fetchRooms();
    
  }, []);
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const checkTokenAndHandle = () => {
      const token = localStorage.getItem('jwtToken');
      if (token && checkTokenExpiration(token)) {
        // 토큰 만료
        isLogin(false);
        fetch("/api/logout").then(res => console.log(res));
      } else if (token && !checkTokenExpiration(token)) {
        isLogin(true);
        setNickname(localStorage.getItem('nickname'));
        setKakaoId(localStorage.getItem('kakaoId'));
        setProfileImageUrl(localStorage.getItem('profileImageUrl'));
        if(localStorage.getItem('isAdmin') == 'true'){
          setIsAdmin(true);
        }
      }
    };
    checkTokenAndHandle();
    const interval = setInterval(checkTokenAndHandle, 60000);
  
    return () => clearInterval(interval);
  }, []);

  useEffect(()=>{
    const getUserInfo = async () => {
      if(localStorage.getItem('kakaoId') == null){

      }
      else{
        try {
          const csrftoken = getCookie('csrftoken');
          const kakaoId = localStorage.getItem('kakaoId');
          fetch(process.env.REACT_APP_DEFAULT_URL+"/api/getUserInfo",{
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({'kakaoId': kakaoId}),
            credentials: 'include'
          }).then(res => res.json()).then(data => {
            const obj = JSON.parse(data.data)
            setNor(obj[0].fields.nor);
            setNov(obj[0].fields.nov);
          }).catch((error)=>{ 
            console.log("에러 발생:", error);
          });
        }catch{

        }
      }
    }
    getUserInfo();
  },[]);

  const logout = () => {
    console.log(process.env.REACT_APP_DEFAULT_URL);
    fetch(process.env.REACT_APP_DEFAULT_URL+"/api/logout").then(res => res.json).then(data => console.log('logout')).catch((error) => {
      console.log("에러 발생:", error);
    });
    localStorage.clear();
    isLogin(false);
    setIsAdmin(false);
  }

  const handleNewTopicChange = (e) => {
    setNewTopic(e.target.value);
  }

  const handleNewPeriodChange = (e) => {
    setNewPeriod(e.target.value);
  }

  const createTopic = () => {
    const csrftoken = getCookie('csrftoken');
    fetch(process.env.REACT_APP_DEFAULT_URL+"/api/createTopic",{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+ localStorage.getItem('jwtToken'),
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({'topic': newTopic, 'period': newPeriod}),
      credentials: 'include'
    }).then(res => res.json()).then(data => {
      setNewTopic('');
      setNewPeriod(0);
      fetchRooms();
    }).catch((error)=>{ 
      console.log("에러 발생:", error);
    });
  }

  const fetchRooms = async () => {
    console.log('version 0.9.5');
    try {
      const response = await fetch(process.env.REACT_APP_DEFAULT_URL+"/api/getRoomInfoAll");
      if (!response.ok) {
        console.log('error!');
      }
      const data = await response.json();
      setRooms(JSON.parse(data));
      } catch (error) {
          console.error("Fetching data failed", error);
      }
  };
  
  return (
    <section className="bg-zinc-900 h-full">
      <div className={"container px-6 py-10 mx-auto" + (open == true ? " blur" : "")}>
        <div id="menuToggle" className="cursor-pointer absolute top-0 right-0 m-5" onClick={toggleMenu}>
          <div className="h-1 w-6 bg-gray-700 my-1"></div>
          <div className="h-1 w-6 bg-gray-700 my-1"></div>
          <div className="h-1 w-6 bg-gray-700 my-1"></div>
        </div>
        <div
          className={`menu-container fixed top-0 right-0 h-full bg-gray-800 w-64 transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="menu p-8 text-white">
          <div className="flex justify-end">
            <button
              onClick={toggleMenu}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {
            login == true ? (
            <div>
              <p><span>{nickname}</span></p>
              <p>작성 댓글 수 <span id="nor">{nor}</span></p>
              <p>투표 수 <span id="nov">{nov}</span></p>
              <button className="text-gray-600" onClick={logout}>로그아웃</button>
            </div>
            )
            :(
            <a href={KAKAO_AUTH_URL}><img src="https://cdn.imweb.me/upload/S20210304872ba49a108a8/89a68d1e3674a.png" alt="kakao Logo" className="w-8 h-8 mr-2 float-left"/><span className="flex-grow">카카오 로그인</span></a>
            )
          }
          {
            isAdmin == true ? 
            <div>
              <p className="mt-10 mb-4">새 토픽 만들기</p>
              <input type="text" placeholder="토픽" className="w-full flex-1 border rounded-full px-4 py-2 focus:outline-none text-black text-sm" value={newTopic} onChange={handleNewTopicChange} id="newTopic"/>
              <label>기간</label>
              <input name="period" type="number" className="text-black w-10 mt-4" value={newPeriod} onChange={handleNewPeriodChange} id="newPeriod"/>
                    
              <button className="bg-gray-700 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded shadow mt-3 float-right" onClick={createTopic}>
                만들기
              </button>
            </div>
            :
            <div>
            </div>
          }
          </div>
        </div>
      <h1 className="w-48 h-2 mx-auto bg-gray-200 rounded-lg dark:bg-gray-800"></h1>
      <div className="grid grid-cols-1 gap-8 mt-8 xl:mt-12 xl:gap-12 sm:grid-cols-2 xl:grid-cols-3 lg:grid-cols-3">
        
        {
          rooms.map(function (a, i) {
            return (
              <Card id={a.pk} topic={a.fields.topic} pros={a.fields.pros} cons={a.fields.cons} date={a.fields.created_at} period={a.fields.period} reply={a.fields.replies} isOpen={isOpen} open={open} setModalData={setModalData} />
            )
          })
        }
      </div>
    </div>
      {
        open == true ? <Modal isOpen={isOpen} modalData={modalData} /> : null
        
      }
      
    </section >
  );
}

function Card(props) {
  const topicId = props.id;

  const formatDate = (date) => {
    const newDate = new Date(date);
    return newDate.toLocaleDateString('ko-KR');
  }

  const addedDate = (date, period) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + period);
    return newDate.toLocaleDateString('ko-KR');
  }

  const dDay = (date, period) => {
    const today = new Date();
    const target = new Date(date);
    target.setDate(target.getDate() + period);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  
    const diff = targetDate - todayDate;
    const diffDays = diff / (1000 * 60 * 60 * 24);
  
    if (diffDays === 0) {
      return 'D-Day';
    } else if (diffDays > 0) {
      return 'D-' + diffDays;
    } else {
      return 'D+' + Math.abs(diffDays);
    }
  };

  const navigate = useNavigate();

  const handleCardClick = () =>{
    navigate('/room?topic=' + topicId);
  }

  /*408px */
  return (
    <div className="w-full">

      <div className="w-full h-64 bg-gray-300 rounded-lg dark:bg-gray-600 flex items-center">
        <div className="w-full h-64 bg-white dark:bg-zinc-800 h-52 rounded-lg" onClick={handleCardClick}>
          <div className="flex flex-col items-center justify-evenly h-full p-3">
            <h4 className="text-xl font-bold text-navy-700 text-black dark:text-white  text-center mt-3 w-full">
              {props.topic}
            </h4>
            <div className="w-full h-6 bg-gray-200 rounded-full dark:bg-gray-700">
              <div className="h-6 bg-blue-600 rounded-full dark:bg-blue-500" style={{ width: props.pros + props.cons > 0 ? `${((props.pros / (props.pros + props.cons)) * 100).toFixed(2)}%` : '0%' }}></div>
            </div>
            <div className="mt-6 mb-3 w-full flex justify-around">
              <div className="flex flex-col items-center ">
                <p className="text-2xl font-bold text-navy-700 text-black dark:text-white whitespace-nowrap">{props.reply}</p>
                <p className="text-sm font-normal text-gray-600 dark:text-white whitespace-nowrap">댓글 수</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-navy-700 text-black dark:text-white whitespace-nowrap">
                  {props.pros == 0 ? '0' : (props.pros / (props.pros + props.cons)).toFixed(4) * 100}%
                </p>
                <p className="text-sm font-normal text-gray-600 dark:text-white whitespace-nowrap">찬성</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-navy-700 text-black dark:text-white whitespace-nowrap">
                  {props.pros + props.cons}
                </p>
                <p className="text-sm font-normal text-gray-600 dark:text-white whitespace-nowrap">투표수</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h1 className="h-6 mt-4 bg-gray-200 rounded-lg dark:bg-zinc-800 dark:text-white w-fit pr-2">
        <span className="ml-3 font-bold">{formatDate(props.date)} - {addedDate(props.date, props.period)}</span>
      </h1>
      <p className="w-24 h-6 mt-4 bg-gray-200 rounded-lg dark:bg-zinc-800 text-center">
        <span className="font-bold text-sm dark:text-white">{dDay(props.date, props.period)}</span>
      </p>
    </div>
  )
}

function Modal(props) {
  let [pros, setPros] = useState();
  let [cons, setCons] = useState();
  let [chat_pro, setChat_pro] = useState([]);
  let [chat_con, setChat_con] = useState([]);


  return (
    <div className="w-11/12 rounded-3xl p-10 flex flex-col justify-center fixed bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="left-10 justify-start">
        <div className="flex items-center justify-start rounded">
          <button className='relative inline-flex text-sm sm:text-base rounded-full font-medium border-2 border-transparent transition-colors outline-transparent focus:outline-transparent disabled:opacity-50 disabled:pointer-events-none disabled:opacity-40 disabled:hover:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
        text-white bg-[#4040F2] hover:bg-[#3333D1] focus:border-[#B3B3FD] focus:bg-[#4040F2] px-4 py-1' onClick={() => { props.isOpen(false) }}>
            Back
          </button>
        </div>
      </div>
      <div className="text-4xl font-bold mb-10 flex justify-center">
        {props.modalData.topic}
      </div>
      <div className="w-full flex justify-center mb-10">
        <div className="pro bg-white border-solid border-gray-500 border-2 h-5 w-12 table-cell text-center text-sm rounded-3xl hover:cursor-pointer">찬성</div>
        <div className="proPercentage mx-3 font-bold w-14 text-center">25%</div>
        <div className="w-1/2 h-5 rounded-lg bg-gray-300 flex">
          <div className="proGage h-full bg-yellow-300 rounded-l-lg w-1/4 text-center">250</div>
          <div className="conGage h-full bg-blue-400 rounded-r-lg w-3/4 text-center">750</div>
        </div>
        <div className="conPercentage mx-3 font-bold w-14 text-center">75%</div>
        <div className="con bg-white border-solid border-gray-500 border-2 h-5 w-12 table-cell text-center text-sm rounded-3xl hover:cursor-pointer">반대</div>
      </div>
      <div className="flex h-full">
        <div className="h-96 flex-1 overflow-y-auto p-4 border-4 border-solid border-gray-500 rounded-xl">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-end">
              <div className="bg-blue-200 text-black p-2 rounded-lg max-w-xs">
                <div className="text-sm align-text-bottom text-right">
                  나
                </div>
                그럴 수도 있지
                <div className="text-sm w-full align-text-bottom text-right">
                  2023.10.08 20:08
                </div>
              </div>
            </div>

            <div className="flex justify-end">

              <div className="bg-blue-200 text-black p-2 rounded-lg max-w-xs">
                <div className="text-sm align-text-bottom text-right">
                  나
                </div>
                군대 갔다 와봐라 이렇게 되나 안되나
                <div className="text-sm w-full align-text-bottom text-right">
                  2023.10.08 20:09
                </div>
              </div>
            </div>

            <div className="flex">
              <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                <div className="text-sm align-text-bottom text-left">
                  고O몽
                </div>
                반대표 틀딱들 틀니 압수해버려야 함
                <div className="text-sm w-full align-text-bottom text-right">
                  2023.10.08 20:13
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1 max-h-full bg-black rounded-lg mx-10">

        </div>
        <div className="h-96 flex-1 overflow-y-auto p-4 border-4 border-solid border-gray-500 rounded-xl">
          <div className="flex flex-col space-y-2">
            <div className="flex">
              <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                <div className="text-sm align-text-bottom text-left">
                  김O똘
                </div>
                이게 그 히키코모리인가 그거냐?
                <div className="text-sm w-full align-text-bottom text-right">
                  2023.10.08 20:07
                </div>
              </div>
            </div>
            <div className="flex">
              <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                <div className="text-sm align-text-bottom text-left">
                  이O계
                </div>
                아놔~~요.즘것들.@기술을배워야.한다.너,,,같은.놈들.때문에 출산률이~~~!!!
                <div className="text-sm w-full align-text-bottom text-right">
                  2023.10.08 20:10
                </div>
              </div>
            </div>
            <div className="flex">
              <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                <div className="text-sm align-text-bottom text-left">
                  박OO세
                </div>
                돈.이업으면,,공장을가야지.왜.??
                <div className="text-sm w-full align-text-bottom text-right">
                  2023.10.08 20:10
                </div>
              </div>
            </div>
            <div className="flex">
              <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
                <div className="text-sm align-text-bottom text-left">
                  이O수
                </div>
                찬성하는 놈들은 다 무직백수흙수저지?
                <div className="text-sm w-full align-text-bottom text-right">
                  2023.10.08 20:11
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 flex items-center">
        <input type="text" placeholder="Type your message..." className="flex-1 border rounded-full px-4 py-2 focus:outline-none" />
        <button className="bg-blue-500 text-white rounded-full p-2 ml-2 hover:bg-blue-600 focus:outline-none">
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
        </button>
      </div>
    </div>
  )
}

const checkTokenExpiration = (token) => {
  try {
    const decodedToken = jwtDecode(token);
    const expirationTime = decodedToken.exp * 1000;
    const currentTime = Date.now();

    return expirationTime < currentTime;
  } catch (error) {
    console.error('Token decoding error:', error);
    return true; 
  }
};



export default App;
