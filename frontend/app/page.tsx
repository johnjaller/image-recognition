'use client'
// import Image from 'next/image'
import Search from '@/components/Search';
import {
  Drawer, DrawerBody,
  DrawerCloseButton,
  DrawerContent, DrawerHeader,
  DrawerOverlay,
  Heading,
  Image,
  SimpleGrid,
  Skeleton,
  useDisclosure
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const toDataURL = (url: string) => fetch(url)
  .then(response => response.blob())
  .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  }))
export default function Home() {
  const [file, setFile] = useState<File | string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'upload' | 'view' | null>(null)
  const [query, setQuery] = useState<string>('')
  const [isImagesLoading, setIsImagesLoading] = useState(false)
  const [result, setResult] = useState<{ [key: string]: number } | null>(null)
  const [uid, setUid] = useState<string>('')
  const [images, setImages] = useState<Array<{ uid: string, img: string, tags: Array<string>, result: { [key: string]: number } }>>([])
  const { isOpen, onOpen, onClose } = useDisclosure()

  const submitHandling = async (fileData: File) => {
    setIsLoading(true)
    setFile(fileData)
    if (fileData) {
      const base64 = await toDataURL(URL.createObjectURL(fileData))
      let formData = new FormData()
      formData.append('img', base64 as string)
      formData.append('uid', uid)
      // var reader = new FileReader();
      // reader.onload = function(){
      //   var output = document.getElementById('output_image');
      //   output.src = reader.result;
      // }


      fetch('http://127.0.0.1:5000/recognition', {
        method: 'POST', body: formData
      }).then(res => res.json()).then((result) => {
        setResult(result)
        setIsLoading(false)
        onOpen()
        setMode('upload')

      }).finally(() => {
        setIsLoading(false)
        setTimeout(() => {
          loadImages().finally(() => {

            setIsImagesLoading(false)
          })
        }, 500)
      })
    }
  }
  useEffect(() => {
    const userId = localStorage.getItem('uid')
    if (userId) {
      setUid(userId)
    } else {
      const newUserId = uuidv4()
      setUid(newUserId)
      localStorage.setItem('uid', newUserId)
    }
  }, [])
  const loadImages = async (query?: string) => {
    setIsImagesLoading(true)
    return fetch(!query ? 'http://127.0.0.1:5000/images' : 'http://127.0.0.1:5000/images?search=' + query).then(res => res.json()).then((result) => {
      setImages(result.data)

    })
  }
  useEffect(() => {
    loadImages(query).finally(() => {
      setTimeout(() => {

        setIsImagesLoading(false)
      }, 2000)
    })

  }, [query])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">

      <Search onSubmit={submitHandling} isLoading={isLoading} value={query} onChange={(evt) => setQuery(evt.target.value)} />
      <Heading className='self-start' as='h2' size={'lg'} mt={4}>Recent Photos</Heading>
      <SimpleGrid columns={[3, null, 5]} mt={6} spacing={5}>
        {isImagesLoading ?
          Array.from({ length: 5 }).map((i, index) =>
            <Skeleton height='200px' width='200px' key={index} />
          ) : images.map(item => <Image sizes='200px' key={item.id} src={item.img} alt='' onClick={() => {
            setFile(item.img)
            setResult(item.result)
            onOpen()
            setMode('view')
          }} />)
        }
      </SimpleGrid>
      <Drawer placement={'right'} size={mode === 'upload' ? 'full' : 'lg'} onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent background={'black'}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth='1px' borderBottomColor={'gray.50'} >Result</DrawerHeader>
          <DrawerBody>
            {file && <Image src={typeof file === 'string' ? file : URL.createObjectURL(file)} width='400' height='200' alt="" />}
            {result &&
              <div className='flex w-100 gap-2 my-5'>

                {Object.keys(result).map(item =>
                  <span className='bg-[#eaeaea] text-black rounded-3xl py-2 px-4' key={result[item]}>

                    {item}
                  </span>

                )}
              </div>

            }
            {result &&
              <table className='border-separate border-spacing-2 border'>
                <thead><th>Object</th>
                  <th>Possibility</th>
                </thead>
                <tbody>

                  {Object.keys(result).map(item =>
                    <tr key={result[item]}>
                      <td className='border border-slate-600 p-2'>{item}</td>
                      <td className='border border-slate-600 p-2'>{result[item]}%</td>
                    </tr>

                  )}
                </tbody>
              </table>

            }
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {/* <form onSubmit={submitHandling}>
        <button type='submit'>Submit</button>
        {file && <Image src={URL.createObjectURL(file)} width='400' height='200' alt="" />}
      </form>
      {result &&
        <div className='flex w-100 gap-2 my-5'>

          {Object.keys(result).map(item =>
            <span className='bg-[#eaeaea] text-black rounded-3xl py-2 px-4' key={result[item]}>

              {item}
            </span>

          )}
        </div>

      }
      {result &&
        <table className='border-separate border-spacing-2 border'>
          <thead><th>Object</th>
            <th>Possibility</th>
          </thead>
          <tbody>

            {Object.keys(result).map(item =>
              <tr key={result[item]}>
                <td className='border border-slate-600 p-2'>{item}</td>
                <td className='border border-slate-600 p-2'>{result[item]}%</td>
              </tr>

            )}
          </tbody>
        </table>

      } */}

    </main>
  )
}