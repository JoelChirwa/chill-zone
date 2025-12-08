import React from 'react'
import toast from 'react-hot-toast'

const HomePage = () => {
  return (
    <button onClick={()=> toast.success("Hello there!!")}>Click Me</button>
  )
}

export default HomePage