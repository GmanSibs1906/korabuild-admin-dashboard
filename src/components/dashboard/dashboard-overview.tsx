"use client";

import { 
  BarChart3, 
  Building2, 
  CheckSquare, 
  CreditCard, 
  TrendingUp, 
  Users 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function DashboardOverview() {
  // Mock data - in real app, this would come from Supabase
  const stats = [
    {
      name: "Active Projects",
      value: "12",
      change: "+4.75%",
      changeType: "positive" as const,
      icon: Building2,
    },
    {
      name: "Total Users",
      value: "245",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      name: "Approved Contractors",
      value: "18",
      change: "+2.02%",
      changeType: "positive" as const,
      icon: CheckSquare,
    },
    {
      name: "Monthly Revenue",
      value: formatCurrency(2840000),
      change: "+8.2%",
      changeType: "positive" as const,
      icon: CreditCard,
    },
  ];

  const recentProjects = [
    {
      id: "1",
      name: "Sandton Office Complex",
      client: "ABC Corporation",
      status: "in_progress",
      progress: 75,
      budget: 15000000,
    },
    {
      id: "2", 
      name: "Residential Development",
      client: "XYZ Developers",
      status: "planning",
      progress: 25,
      budget: 8500000,
    },
    {
      id: "3",
      name: "Shopping Mall Renovation",
      client: "Retail Group",
      status: "completed",
      progress: 100,
      budget: 12000000,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-h1 font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-body-1 text-gray-600">
          Welcome back! Here's what's happening with your construction projects.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className="absolute bg-orange-500 rounded-md p-3">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                <span className="sr-only">
                  {stat.changeType === "positive" ? "Increased" : "Decreased"} by
                </span>
                {stat.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent projects table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-h3 font-semibold text-gray-900">Recent Projects</h3>
              <p className="mt-2 text-sm text-gray-700">
                A list of recent construction projects and their current status.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto"
              >
                View All Projects
              </button>
            </div>
          </div>
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Project Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Client
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Progress
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Budget
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentProjects.map((project) => (
                      <tr key={project.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          {project.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {project.client}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              project.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : project.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {project.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className="bg-orange-600 h-2.5 rounded-full"
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {project.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatCurrency(project.budget)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 