// https://codepen.io/chris__sev/pen/JjRqOxa

function Loader() {
  return (
    <div className="backdrop-blur-sm absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center z-[500] rounded">
      <svg
        className="animate-spin rounded-[100%] h-5 w-5 border-dotted border-8 border-gray-500 mr-3 p-8"
        viewBox="0 0 24 24"
      ></svg>
    </div>
  )
}

export default Loader
