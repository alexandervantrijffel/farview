import Photos from 'googlephotos'
import log from './log'
import { envString } from './env'

interface Result {
  albums?: Albums
  nextPageToken: string
}
interface Albums {
  albums: Album[]
}
interface Album {
  id: string
  title: string
  productUrl: string
  mediaItemsCount: string
  coverPhotoBaseUrl: string
  coverPhotoMediaItemId: string
}
const theToken = envString('TEST_TOKEN')
const photos = new Photos(theToken)

const listAlbums = async (nextPageToken: string | undefined = undefined) => {
  const albums: Result = await photos.albums.list(50, nextPageToken)
  log.debug('albums', { albums })
  if (albums.nextPageToken) {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    listAlbums(albums.nextPageToken)
  }
}
export default async () => {
  try {
    // const result = await photos.albums.create('Test2')
    // console.log('res', result)
    //
    // const mediaItems = await photos.mediaItems.list(3)
    // log.debug('got mediaItems', { mediaItems })

    // await listAlbums()
    //
    await photos.albums.batchAddMediaItems('albumid', ['mediaItemId'])
  } catch (err) {
    console.log('fail', err)
    // console.log('json', err.json())
    // const { body } = err.response
    // console.log('body', body)
    // console.log('bodycontents', body)
  }
}
