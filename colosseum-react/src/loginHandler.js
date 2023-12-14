import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
const LoginHandeler = (props) => {
  const navigate = useNavigate();
  const code = new URL(window.location.href).searchParams.get("code");

  axios.defaults.withCredentials = true;
  
  useEffect(() => {
    const kakaoLogin = async () => {
      
      await axios({
        method: "get",
        url: process.env.REACT_APP_DEFAULT_URL+`/api/login/kakao?code=${code}`,
        headers: {
          //"Content-Type": "application/json;charset=utf-8", //json형태로 데이터를 보내겠다는뜻
          //"Access-Control-Allow-Origin": "*", //이건 cors 에러때문에 넣어둔것. 당신의 프로젝트에 맞게 지워도됨
        },
      }).then((res) => { //백에서 완료후 우리사이트 전용 토큰 넘겨주는게 성공했다면
        console.log(res);
        //계속 쓸 정보들( ex: 이름) 등은 localStorage에 저장해두자
        localStorage.setItem("kakaoId", res.data.kakaoId);
        localStorage.setItem("nickname", res.data.nickname);
        localStorage.setItem("profileImageUrl", res.data.profileImageUrl);
        localStorage.setItem("jwtToken", res.data.token);
        localStorage.setItem("isAdmin",res.data.isAdmin);
        document.cookie = "X-CSRFToken=" + res.data.csrftoken;
        //로그인이 성공하면 이동할 페이지
        navigate("/");
      }).catch(error => {console.log('error!!! : ' + error);});
    };
    kakaoLogin();
  }, [props.history]);
  
/*
  useEffect(() => {
    //입장시 방 정보 가져오는
    const kakaoLogin = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_DEFAULT_URL+"/api/login/kakao?code="+code);
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
    kakaoLogin();
}, [props.history]);
*/

  return (
    <div className="LoginHandler">
      <div className="notice">
        <p>로그인 중입니다.</p>
        <p>잠시만 기다려주세요.</p>
        <div className="spinner"></div>
      </div>
    </div>
  );
};

export default LoginHandeler;