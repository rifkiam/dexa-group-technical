import Input from "../../components/Input";
import Button from "../../components/Button";
import { login } from "../../api/api";
import { toast } from "sonner";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router";

export default function LoginPage() {
  const [cookies, setCookie] = useCookies(['token', 'refreshToken']);
  const navigate = useNavigate();

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    const res = await login(email, password)
    if (res.statusCode !== 200 || !res.data) {
      toast.error(res.message);
    } else {
      setCookie('token', res.data.accessToken, { path: '/' });
      setCookie('refreshToken', res.data.refreshToken, { path: '/' });
      toast.success('Logged in successfully');
      console.log(cookies);

      if (res.data.user.role === 'admin') {
        navigate('/monitoring');
      } else {
        navigate('/attendance');
      }
    }
  }

  return (
  <div className="transform translate-y-1/2">
    <div className="w-full max-w-90 mx-auto border rounded-xl border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input type="email" placeholder="Email" label="Email" name="email" required />
        <Input type="password" placeholder="Password" label="Password" name="password" required />
        <Button type="submit" className="mt-4">Login</Button>
      </form>
    </div>
  </div>
  );
}
