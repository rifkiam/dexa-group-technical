import { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import Button from "../../components/Button";
import ImagePreviewModal from "../../components/ImagePreviewModal";
import Table, { type TableColumn } from "../../components/Table";
import { getAttendanceList } from "../../api/api";
import { getPublicS3ObjectUrl } from "../../lib/s3";
import type { Attendance } from "../../types/types";

export default function MonitoringPage() {
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cookies] = useCookies(["token"]);
  const token = cookies.token;

  useEffect(() => {
    let isCurrent = true;

    if (!token) {
      setError("Your session has expired. Sign in again to view attendance.");
      setAttendanceList([]);
      setIsLoading(false);
      return () => { isCurrent = false; };
    }

    setIsLoading(true);
    setError(null);
    getAttendanceList(token)
      .then((response) => {
        if (response.statusCode < 200 || response.statusCode >= 300 || !response.data) {
          throw new Error(response.message ?? "Failed to fetch attendance list.");
        }
        if (!Array.isArray(response.data.data)) {
          throw new Error("The attendance API returned an invalid list.");
        }
        if (isCurrent) setAttendanceList(response.data.data);
      })
      .catch((requestError: unknown) => {
        if (isCurrent) {
          setError(requestError instanceof Error ? requestError.message : "Failed to fetch attendance list.");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => { isCurrent = false; };
  }, [token]);

  function openImage(attendance: Attendance) {
    setSelectedAttendance(attendance);
    setImageUrl(attendance.imageKey ? getPublicS3ObjectUrl(attendance.imageKey) : null);
  }

  const closeImage = useCallback(() => {
    setSelectedAttendance(null);
    setImageUrl(null);
  }, []);

  const columns: TableColumn<Attendance>[] = [
    {
      key: "employeeId",
      header: "Employee ID",
      render: (attendance) => attendance.employeeId,
    },
    {
      key: "email",
      header: "Email",
      render: (attendance) => attendance.email,
    },
    {
      key: "createdAt",
      header: "Submitted",
      render: (attendance) => new Date(attendance.createdAt).toLocaleString(),
    },
    {
      key: "imageKey",
      header: "Image key",
      render: (attendance) => (
        <Button
          type="button"
          variant="secondary"
          className="max-w-72 truncate text-left text-xs cursor-pointer"
          title="View image"
          onClick={() => openImage(attendance)}
        >
          {attendance.imageKey ? "View image" : "No image"}
        </Button>
      ),
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Attendance list</h1>
        <p className="text-sm text-gray-600">Submitted WFH attendance records.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {isLoading ? (
        <p role="status" className="py-8 text-center text-gray-600">Loading attendance…</p>
      ) : (
        <Table
          ariaLabel="Attendance records"
          rows={attendanceList}
          columns={columns}
          rowKey={(attendance) => attendance.id}
          emptyMessage={error ? "Attendance records could not be loaded." : "No attendance records yet."}
        />
      )}

      {selectedAttendance && (
        <ImagePreviewModal
          imageUrl={imageUrl}
          imageKey={selectedAttendance.imageKey}
          onClose={closeImage}
        />
      )}
    </section>
  );
}
