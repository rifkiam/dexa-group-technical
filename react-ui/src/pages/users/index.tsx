import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useCookies } from 'react-cookie';
import { toast } from 'sonner';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Table, { type TableColumn } from '../../components/Table';
import { createUser, deleteUser, getUsers, updateUser } from '../../api/api';
import { decodeAccessToken } from '../../lib/jwt';
import type { ManagedUser, UserFormData } from '../../types/types';

const emptyForm: UserFormData = { name: '', email: '', employeeId: '', role: 'user', password: '' };

export default function UsersPage() {
  const [cookies] = useCookies(['token']);
  const token = cookies.token as string | undefined;
  const currentUser = decodeAccessToken(token);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadUsers = useCallback(async () => {
    if (!token) {
      setError('Your session has expired. Sign in again to manage users.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers(token);
      if (response.statusCode < 200 || response.statusCode >= 300 || !Array.isArray(response.data)) {
        throw new Error(response.message ?? 'Could not load users.');
      }
      setUsers(response.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function beginEdit(user: ManagedUser) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, employeeId: user.employeeId, role: user.role as 'user' | 'admin', password: '' });
  }

  function resetForm() {
    setEditingUser(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const payload = { ...form, email: form.email.trim().toLowerCase() };
      const response = editingUser
        ? await updateUser(editingUser.id, { ...payload, password: payload.password || undefined }, token)
        : await createUser(payload as UserFormData, token);
      if (response.statusCode < 200 || response.statusCode >= 300 || !response.data) {
        throw new Error(response.message ?? `Could not ${editingUser ? 'update' : 'create'} user.`);
      }

      toast.success(editingUser ? 'User updated.' : 'User created.');

      resetForm();
      await loadUsers();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Could not save user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: ManagedUser) {
    if (!token || !window.confirm(`Delete ${user.name} (${user.email})?`)) return;
    try {
      const response = await deleteUser(user.id, token);
      if (response.statusCode < 200 || response.statusCode >= 300 || !response.data) {
        throw new Error(response.message ?? 'Could not delete user.');
      }
      
      toast.success('User deleted.');
      if (editingUser?.id === user.id) resetForm();
      await loadUsers();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Could not delete user.');
    }
  }

  const columns: TableColumn<ManagedUser>[] = [
    { key: 'name', header: 'Name', render: (user) => user.name },
    { key: 'email', header: 'Email', render: (user) => user.email },
    { key: 'employeeId', header: 'Employee ID', render: (user) => user.employeeId },
    { key: 'role', header: 'Role', render: (user) => user.role },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => beginEdit(user)}>Edit</Button>
          <Button type="button" variant="destructive" disabled={user.id === currentUser?.sub} onClick={() => void handleDelete(user)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Manage users</h1>
        <p className="text-sm text-gray-500">Create accounts, update user details and roles, or remove accounts.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-gray-700 bg-[#1f2028] p-4 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="text-lg font-semibold sm:col-span-2 lg:col-span-3">{editingUser ? `Edit ${editingUser.name}` : 'Create user'}</h2>
        <Input label="Name" name="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input label="Email" name="email" type="email" required disabled={Boolean(editingUser)} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <Input label="Employee ID" name="employeeId" required value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} />
        <label className="flex flex-col gap-1 text-sm">Role
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as 'user' | 'admin' })}
            className="rounded-md border border-gray-600 bg-[#1f2028] px-3 py-2 mt-1"
          >
            <option value="user">User</option><option value="admin">Admin</option>
          </select>
        </label>
        <Input label={editingUser ? 'New password (optional)' : 'Password'} name="password" required={!editingUser} minLength={8} type="password" autoComplete="new-password" value={form.password ?? ''} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editingUser ? 'Save changes' : 'Create user'}</Button>
          {editingUser && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
        </div>
      </form>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p role="status" className="py-8 text-center text-gray-500">Loading users…</p> : (
        <>
          <Table ariaLabel="Users" rows={pagedUsers} columns={columns} rowKey={(user) => user.id} emptyMessage="No users found." />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <label htmlFor="users-page-size">Rows per page</label>
              <select
                id="users-page-size"
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
                className="rounded-md border border-gray-600 bg-[#1f2028] px-2 py-1 text-gray-200"
              >
                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
              </select>
              <span>{users.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, users.length)} of ${users.length}` : '0 users'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
              <span>Page {currentPage} of {pageCount}</span>
              <Button type="button" variant="secondary" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
