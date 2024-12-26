import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import "./timeLine.scss";
import { useState } from "react";
import { Button } from "antd";
import useBaseUrl from "@docusaurus/useBaseUrl";
// import timelineList from "../../static/timeLineList.js";

export default function Home() {
 const timelineList=[
  {filePath:'/docs/生活记录/旅行', title:'西岛两日',abstract:'刚看完教父第一部，老电影的质感和内容真不是现在的商业大片能比的之前一直觉得，电影只要讲好故事就是一部优秀的作品了。',time:'',img:'西岛.jpg'},
  {filePath:'/docs/读书电影', title:'《教父》',abstract:'刚看完教父第一部，老电影的质感和内容真不asdasd是现在的商业大片能比的之前一直觉得，电影只要讲好故事就是一部优秀的作品了。但是一部伟大的电影，光影的艺术必不可少',time:'',img:''},
]

  return (
    <Layout description="阿喵的个人Blog，聊聊技术，记录生活">
      <main>
        <div className="timeLine-container">
          <div className="entries">
            {timelineList.map((item) => {
              return (
                <div className="entry" key={item.title}>
                  <Link to={item.filePath + "/" + item.title} className="title">
                    {item.title}
                  </Link>
                  <div className="body">
                    <p>{item.abstract}</p>
                   {item.img? <div className="imgWrap" style={{background:`url(${useBaseUrl("/img/home/"+item.img)})`,color:'red'}} >
                   {/* <img src={useBaseUrl("/img/home/1.png")} alt="未加载" /> */}
                   </div> :<></>}
                  </div>
                </div>
              );
            })}

            {/* <div className="entry">
              <div className="title">2012</div>
              <div className="body">
                <p>
                  Quo nobis cumque dolor iure voluptatem voluptatem alias
                  soluta.
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </main>
    </Layout>
  );
}
