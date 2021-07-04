import axios from 'axios'

const uploadToken = `http://209.182.232.41:8080/ideeza-image-server-0.0.1-SNAPSHOT/api/token`;
const getImg = `http://209.182.232.41:8080/ideeza-image-server-0.0.1-SNAPSHOT/api/getfile/`;

export const attachImgToId = async function (url, isEngine = false) {
  let res1 = await axios.post(uploadToken, {
    client_id: `QI18tbTszYR5VhDm7p1LFFMmi5tGx5CU`,
    client_secret: `4P6fHneznaZZ5BcHTHWc125PHRaJ35ukGFyMHGLdI0qn15TXyuulSgTYaSo56EPy`
  })
  let imageToken = res1.data.access_token
  window.imageToken = imageToken
  //
  if (isEngine) {
    return new Promise(async (res)=>{
      let x = await axios.get(`${getImg}${url}`)
      res(x)
    })
  }
  else {
    let x = await axios.get(`${getImg}${url}`)
    return x.data.base64
  }
}
