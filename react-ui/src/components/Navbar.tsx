interface NavbarProps {
    title: string;
}

export default function Navbar({ title }: NavbarProps) {
    return (
        <div className="flex justify-between items-center">
            <h1>{title}</h1>
            <div className="flex gap-2">
                <button>
                    Log out
                </button>
            </div>
        </div>
    )
}