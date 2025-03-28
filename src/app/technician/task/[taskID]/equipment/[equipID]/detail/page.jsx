'use client'
import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import {
  InfoCircleOutlined,

} from '@ant-design/icons';
import { Badge, Space, Switch, Button, notification, Modal } from 'antd';
import { FaArrowLeft } from "react-icons/fa6";
import BottomNav from '@/components/Bottom-Nav';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import NotFoundPage from '@/components/NotFoundPage';
import { getUser } from '@/lib/userManipulate';
import Loading from '@/components/LoadingPage';
import { EquipmentStatusCheck, EquipmentStatusTextCheck } from '@/lib/statusChecker';
import { stripHtmlTags } from '@/lib/stripHtml';
function DetailPage({ params }) {

  const { equipID, taskID } = params;
  // console.log(equipID, taskID);
  const router = useRouter();


  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState(0)
  const [note, setNote] = useState('');
  const [showAfterImage, setShowAfterImage] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [imagesPreviewAfter, setImagePreviewAfter] = useState([]);
  const [videoPreviewAfter, setVideoPreviewAfter] = useState([]);
  const [videoPreviewBefore, setVideoPreviewBefore] = useState([]);
  const [imagesPreviewBefore, setImagePreviewBefore] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedImage(null);
  };


  const loadFormData = async () => {
    try {
      const usr = await getUser();
      if (!usr) throw new Error('No authorized');
      const response = await axios.get(`/api/maintenance/report?eid=${equipID}&jid=${taskID}`);
      setFormData(response.data);
      if (response.data.id) {
        const imageResponse = await axios.get(`/api/image/images-after?id=${response.data.id}`);
        if (imageResponse.data.report_images_after) {
          setImagePreviewAfter(imageResponse.data.report_images_after)
        }
      }
      if (response.data.id) {
        const imageResponse = await axios.get(`/api/image/images-before?id=${response.data.id}`);
        if (imageResponse.data.report_images_before) {
          setImagePreviewBefore(imageResponse.data.report_images_before);
        }
      }
      if (response.data.id) {
        const video_before = "video-before"
        const videoResponse = await axios.get(`/api/video/${video_before}?id=${response.data.id}`);
        if (videoResponse.data.report_video) {
          setVideoPreviewBefore(videoResponse.data.report_video);
        }
      }

      if (response.data.id) {
        const video_after = "video-after"
        const videoResponse = await axios.get(`/api/video/${video_after}?id=${response.data.id}`);
        if (videoResponse.data.report_video) {
          setVideoPreviewAfter(videoResponse.data.report_video);
        }
      }
      setNote(response.data.note || '');
      setStatus(response.data.last_status || 0);


    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (currentStatus, particiPants) => {
    // TODO: Update status and note in the API
    try {
      const usr = await getUser();
      if (!usr) throw new Error('No authorized');

      // Check if there are existing participants
      if (particiPants && particiPants !== usr.user_id) {
        notification.info({
          message: 'Task In Progress',
          description: `The team is currently working on this task.`,
        });
        return;
      }

      if (["pending", "in_progress", "complete"].includes(currentStatus)) {
        router.push(`/technician/task/${taskID}/equipment/${equipID}`);
        return;
      }

      // Show confirmation modal before proceeding with the update
      Modal.confirm({
        title: 'Are you sure you want to edit this?',
        onOk: async () => {
          // Prepare the payload for updating the status and setting the participant
          const payload = {
            job_id: parseInt(taskID),
            equipment_id: parseInt(equipID),
            status: formData.last_status, // Use the mapped string status
            participants: usr.user_id,
          };

          try {
            // Send the update request
            const res = await axios.patch(`/api/maintenance/report`, payload);
            if (res.status === 200) {
              // notification.success({
              //   message: 'Success',
              //   description: 'Update successful',
              // });
              // Uncomment if you want to navigate after successful update
              router.push(`/technician/task/${taskID}/equipment/${equipID}`);
            } else {
              notification.error({
                message: 'Update Failed',
                description: res.data.message || 'An error occurred while updating.',
              });
            }
          } catch (error) {
            notification.error({
              message: 'Submission Error',
              description: error.response?.data?.message || 'An error occurred.',
            });
          }
        },
        onCancel() {
          console.log('Update cancelled');
        },
      });
    } catch (error) {
      notification.error({
        message: 'Submission Error',
        description: error.response?.data?.message || 'An error occurred.',
      });
    }
  };

  const handleSwitchChange = (checked) => {
    setShowAfterImage(checked);
  };


  useEffect(() => {
    loadFormData();
    // eslint-disable-next-line
  }, []);

  const LastStatus = status === 'break_down'
    ? 'Break Down'
    : status === 'complete'
      ? 'Complete'
      : status === 'pending'
        ? 'Pending'
        : 'In Progress';


  if (isLoading) return (<Loading />)
  if (Object.keys(formData).length > 0) {
    return (
      <Suspense fallback={<Loading />}>
        <div className=''>
          <BottomNav>
            <div className="w-full  h-screen bg-red-200 bg-gradient-to-b from-gray-50 to-red-500">
              <div className='grid grid-cols-1  bg-yellow-300x'>
                <div className='bg-slate-400x flex justify-center py-2'>
                  <Image src="/logo.png" className="self-center  " width={122} height={10} alt="logo" unoptimized />
                  <button >
                    <InfoCircleOutlined className="text-gray-500 text-3xl fixed top-3 right-3" />
                  </button>
                  <button>
                    <FaArrowLeft onClick={() => router.back()} className="text-gray-500 text-3xl fixed top-4 left-3" />
                  </button>
                </div>
                <div className='mx-auto w-full bg-yellow-300x flex justify-center'>

                </div>
              </div>
              <div className='h-[80%] bg-pink-400x max-h- p-2'>
                <div className=" w-full bg-white/50  h-[100%]  overflow-scroll p-2 rounded-2xl">



                  <div className='flex justify-end bg-blue-300x px-1 pt-2'>

                    <div className='flex flex-col justify-start items-end font10'>
                      <div className='flex justify-center items-center gap-1 font10 font-bold'>
                        <Badge status={EquipmentStatusCheck(formData.last_status)} />
                        <p className={EquipmentStatusTextCheck(formData.last_status)}>{LastStatus}</p>
                      </div>

                    </div>
                  </div>
                  <div className="w-full my-3 bg-white shadow-md border border-gray-300 border-b-2 border-t-2 border-l-2 border-r-2 rounded-xl px-2 pt-3">
                    <div className='bg-green-400x gap-4 flex flex-col'>
                      <div className='flex self-end gap-2'>
                        {
                          // (formData.write) &&
                          <>
                            <Button onClick={() => handleEdit(formData.status, formData.participants)} type="primary">Edit</Button>
                          </>
                        }
                      </div>
                      <div className='flex font12 gap-2 justify-between border-b-2 border-gray-400 break-words leading-[2]'>
                        <div className='whitespace-nowrap'><span className='font-bold'>Name:</span></div>
                        <div>{formData.equipment_name}</div>
                      </div>
                      <div className='flex font12 justify-between  gap-2 border-b-2 border-gray-400 break-words leading-[2]'>
                        <div className='whitespace-nowrap'><span className='font-bold'>Serial Number:</span></div>
                        <div>{formData.equipment_sr}</div>
                      </div>
                      <div className='flex font12 justify-between  gap-2 border-b-2 border-gray-400 break-words leading-[2]'>
                        <div className='whitespace-nowrap'><span className='font-bold'>Status:</span></div>
                        <div>{LastStatus}</div>
                      </div>
                      <div className='flex font12 justify-between  gap-2 border-b-2 border-gray-400 break-words leading-[2]'>
                        <div className='whitespace-nowrap'><span className='font-bold'>Other:</span>
                        </div>
                        <p dangerouslySetInnerHTML={{ __html: stripHtmlTags(note).replace(/\n/g, "<br>") }} />
                      </div>
                      <div className='flex flex-col'>
                        <div className='flex flex-col justify-center items-center p-3'>
                          <Space direction="vertical">
                            <Switch
                              checkedChildren="After"
                              unCheckedChildren="Before"
                              defaultChecked={showAfterImage}
                              onChange={handleSwitchChange}
                            />
                          </Space>
                        </div>

                        <div className="flex flex-col justify-center items-center p-3 text-center">
                          {showAfterImage ? (
                            imagesPreviewAfter.length > 0 || videoPreviewAfter.length > 0 ? (


                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {videoPreviewAfter.map((video, index) => (
                                  <div key={index} className="relative cursor-pointer">
                                    <video controls className="rounded-md w-[200px]">
                                      <source src={video.video_url} type="video/mp4" />
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                ))}

                                {imagesPreviewAfter.map((image, index) => (
                                  <div
                                    className="relative cursor-pointer"
                                    key={index}
                                    onClick={() => handleImageClick(image.image_url)} // เมื่อกดที่รูป
                                  >
                                    <Image
                                      src={image.image_url}
                                      alt={image.name}
                                      width={200}
                                      height={100}
                                      objectFit="contain"
                                      className="rounded-md"
                                      unoptimized
                                    />
                                  </div>
                                ))}
                              </div>


                            ) : (
                              <div>No image or video uploaded</div>
                            )

                          ) : (
                            imagesPreviewBefore.length > 0 || videoPreviewBefore.length > 0 ? (

                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {videoPreviewBefore.map((video, index) => (
                                  <div key={index} className="relative cursor-pointer">
                                    <video controls className="rounded-md w-[200px]">
                                      <source src={video.video_url} type="video/mp4" />
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                ))}

                                {imagesPreviewBefore.map((image, index) => (
                                  <div
                                    className="relative cursor-pointer"
                                    key={index}
                                    onClick={() => handleImageClick(image.image_url)} // เมื่อกดที่รูป
                                  >
                                    <Image
                                      src={image.image_url}
                                      alt={image.name}
                                      width={200}
                                      height={100}
                                      objectFit="contain"
                                      className="rounded-md"
                                      unoptimized
                                    />
                                  </div>
                                ))}
                              </div>

                            ) : (
                              <div>No image or video uploaded</div>
                            )

                          )
                          }

                          {/* 🔹 Modal แสดงภาพขนาดใหญ่ 🔹 */}
                          {isOpen && selectedImage && (
                            <div
                              className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
                              onClick={handleClose} // ปิด Modal เมื่อกดที่พื้นหลัง
                            >
                              <div className="relative max-w-4xl w-full h-auto">
                                <Image
                                  src={selectedImage}
                                  alt="Selected Image"
                                  layout="responsive"
                                  width={800}
                                  height={600}
                                  objectFit="contain"
                                  className="rounded-lg shadow-lg"
                                  unoptimized
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>


                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BottomNav >
        </div>
      </Suspense>
    )
  } else {
    <NotFoundPage />
  }
}
export default DetailPage