import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-6">
        <h1 className="text-2xl font-bold">
          FC Plouha
        </h1>

        <p className="text-sm text-slate-400 mt-1">
          Administration
        </p>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
