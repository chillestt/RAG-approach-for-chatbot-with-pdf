'use client'
import { Inbox } from 'lucide-react'
import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { UploadToS3 } from '@/lib/s3'
import { useMutation } from '@tanstack/react-query'

import axios from 'axios'
import { toast } from 'react-toastify'

import { Loader2 } from 'lucide-react'

type Props = {}

const FileUpload = (props: Props) => {

    const [upLoading, setUpLoading] = useState(false);
    const {mutate } = useMutation({
        mutationFn: async({
            file_key,
            file_name
        }: {
            file_key: string,
            file_name: string
        }) => {
            const response = await axios.post('/api/create-chat', {
                file_key,
                file_name
            })
            return response.data
        }
    })

    const {getRootProps, getInputProps} = useDropzone({
        accept: {"application/pdf": [".pdf"]},
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0] // get the first file
            if (file.size>10*1024*1024) {
                // bigger than 10mb
                toast.error("File too large!")
                return
            }
            try {
                setUpLoading(true)
                const data = await UploadToS3(file)
                console.log("data", data)
                if (!data?.file_key || !data?.file_name) {
                    toast.error("Something went wrong")
                    return
                }
                mutate(data, {
                    onSuccess: ({ chat_id }) => {
                      toast.success("Chat created!");
                    },
                    onError: (err) => {
                      toast.error("Error creating chat");
                      console.error(err);
                    },
                  });
            }
            catch (error) {
                console.log(error)
            }
            finally {
                setUpLoading(false)
            }
        }
    });
  return (
    <div>
        <div {...getRootProps({
            className: "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col"
        })}>
            <input {...getInputProps()}/>
            {(upLoading)  ? (
                    <>
                            {/* loading state */}
                            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                            <p className="mt-2 text-sm text-slate-400">
                            Spilling Tea to GPT...
                            </p>
                    </>
            ) : (
            <>
                <Inbox className="w-10 h-10 text-blue-500" />
                <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
            </>
            )}

        </div>
    </div>
  )
}

export default  FileUpload;