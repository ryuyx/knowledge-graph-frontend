import { useParams } from 'react-router-dom'

function Doc() {
  const { id } = useParams()
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white/70 via-pink-50/50 to-blue-50/70">
      <div className="hero min-h-100 px-20">
        <div className="hero-content flex-col">
          <h1 className="text-5xl font-bold">Doc Page</h1>
          <p className="py-6">
            This is the doc page for document ID: {id}. You can display doc content here.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Doc