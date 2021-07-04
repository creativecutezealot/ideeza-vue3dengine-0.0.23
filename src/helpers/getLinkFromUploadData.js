/* eslint-disable no-console */
const getLinkFromUploadData = function (data) {
  console.log(`getLinkFromUploadData`, data)
  // get the required file name
  let fileUrl = data.fileDownloadUri
  console.log(`fileUrl: `, fileUrl)
  //
  let i1 = fileUrl.lastIndexOf(`/`) + 1
  let i2 = fileUrl.length
  let reqFileUrl = fileUrl.substring(i1, i2)
  console.log(`reqFileUrl --------> `, reqFileUrl)

  return reqFileUrl
  // /get the required file name
}

export default getLinkFromUploadData
