// libs
import axios from 'axios'

const uploadv2 = `http://209.182.232.41:8080/ideeza-image-server-0.0.1-SNAPSHOT/api/insertfile`;

// helper
import getLinkFromUploadData from './getLinkFromUploadData'

async function upload3d (blob, name = '', returnPromise = false, getFileDownloadUrl = false) {
  // console.log(`################### upload api ####################`)
  const file = new File([blob], name)
  // console.log(`-2: name of form: `, name)
  // console.log(`-1: blob getting: `, blob)
  // console.log(`0: file appending in form: `, file)
  const form = new FormData()
  form.append('file', file)
  form.append('entityName', 'user')
  // console.log(`1: api going to call ==> `, uploadv2)
  // console.log(`2: form going to send ==> `, form)


  if (returnPromise) {
    // console.log(`-- in upload file --`, ` will return promise`)

    return axios.post(`${uploadv2}`, form)
  }
  else {


    if (getFileDownloadUrl) {

      const {data} = await axios.post(`${uploadv2}`, form)

      return data.fileDownloadUri
    }
    else {

      // console.log(`-- in upload file --`, ` will return link`)

      const {data} = await axios.post(`${uploadv2}`, form)
      // console.log(`3: response data ==> `, data)
      // console.log(`#################### upload api ends ###################`)

      return getLinkFromUploadData(data)
    }
  }
}

export default upload3d
