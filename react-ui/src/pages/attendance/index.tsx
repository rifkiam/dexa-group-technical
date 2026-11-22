import Button from "../../components/Button";
import Input from "../../components/Input";

export default function AttendancePage() {
  return (
    <div className="transform translate-y-1/2">
      <div className="w-full max-w-90 mx-auto border rounded-xl border-gray-700 p-4">
        <p className="text-2xl font-bold text-center mb-4">WFH Attendance Form</p>
        <form className="flex flex-col gap-2">
          <Input type="time" placeholder="Time" label="Time" name="time" required />
          <div className="flex flex-row items-center gap-2">
            <Input type="file" accept="image/*" placeholder="Image" label="Image" name="image" required />
            <Button type="button" className="mt-5.5 py-2.5">Capture</Button>
          </div>
          <Button type="submit" className="mt-4">Submit</Button>
        </form>
      </div>
    </div>
  );
}