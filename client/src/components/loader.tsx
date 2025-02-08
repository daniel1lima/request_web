import { Loader2 } from "lucide-react";

const Loader = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
      <Loader2 className="w-6 h-6 text-white animate-spin" />
    </div>
)

  export default Loader;