import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { supabase } from "../lib/supabase";
import { Briefcase, Building2, Calendar, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

interface ApplicationStats {
  total: number;
  byStatus: {
    status: string;
    count: number; // Ensure count is explicitly typed as a number
  }[];
  recentApplications: {
    company: string;
    job_title: string;
    application_date: string;
    status: string;
  }[];
}

const STATUS_COLORS = {
  saved: "#6B7280",
  applied: "#4F46E5",
  interviewing: "#10B981",
  offered: "#F59E0B",
  rejected: "#EF4444",
  accepted: "#8B5CF6",
  declined: "#EC4899",
};

export function Dashboard() {
  const { userDetails } = useAuth();
  const { data: stats, isLoading } = useQuery<ApplicationStats>({
    queryKey: ["applicationStats"],
    queryFn: async () => {
      const { data: applications, error } = await supabase
        .from("job_applications")
        .select("*");

      if (error) throw error;

      const total = applications.length;
      const byStatus = Object.entries(
        applications.reduce(
          (acc: { [x: string]: any }, app: { status: string | number }) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([status, count]) => ({
        status,
        count: count as number, // Explicitly cast the count as number
      }));

      const recentApplications = applications
        .sort(
          (
            a: { application_date: string | number | Date },
            b: { application_date: string | number | Date }
          ) =>
            new Date(b.application_date).getTime() -
            new Date(a.application_date).getTime()
        )
        .slice(0, 5)
        .map(
          (app: {
            company: any;
            job_title: any;
            application_date: any;
            status: any;
          }) => ({
            company: app.company,
            job_title: app.job_title,
            application_date: app.application_date,
            status: app.status,
          })
        );

      return { total, byStatus, recentApplications };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center mt-12 justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="py-3 mt-10 md:mt-0 flex justify-between items-center ">
        <h1 className="text-3xl font-extrabold text-gray-900">Dashboard</h1>
        <h1 className="text-2xl font-semibold text-indigo-600  hidden md:block">
          {userDetails ? `Welcome, ${userDetails.full_name}!` : "Loading..."}
        </h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Briefcase className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Applications
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats?.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Interviews
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats?.byStatus.find((s) => s.status === "interviewing")
                      ?.count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Applications This Week
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats?.recentApplications.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Offers Received
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats?.byStatus.find((s) => s.status === "offered")
                      ?.count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Application Status Distribution
          </h2>
          <div className="h-80 ">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={stats?.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={true}
                  label={({ name, percent }) =>
                    ` ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {stats?.byStatus.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={
                        STATUS_COLORS[
                          entry.status as keyof typeof STATUS_COLORS
                        ]
                      }
                      className="max-w-2"
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap text-left w-auto h-auto overflow-hidden ">
              {Object.keys(STATUS_COLORS).map((status) => (
                <div key={status} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-sm "
                    style={{
                      backgroundColor:
                        STATUS_COLORS[status as keyof typeof STATUS_COLORS],
                    }}
                  ></div>
                  <span className="text-xs font-semibold mr-4">
                    -{status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Bar chats*/}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-7 ">
            Applications by Status
          </h2>
          <div className=" align-center -ml-[6.3rem] -mb-2 h-80 w-110 ">
            <ResponsiveContainer width="100%" height="100%" >
              <BarChart data={stats?.byStatus} layout="vertical">
                <CartesianGrid strokeDasharray="9 1" />

                {/* Swap X and Y axis */}
                <YAxis
                  className="text-xs"
                  dataKey="status"
                  type="category"
                  width={100}
                  // hide={true}
                  tick={false}
                  axisLine={true}   
                  // tickLine={true}       
                          
                />
                <XAxis className="text-xs" type="number" />

                <Tooltip />

                <Bar dataKey="count"  barSize={30} >
                  <LabelList
                    dataKey="status"
                    position="insideLeft"
                    // capitalizing the first letter in the status 
                    formatter={(value: string) =>
                      value.charAt(0).toUpperCase() + value.slice(1)
                    }
            
                    fill="white"
                    fontSize={12}
                  />
                  {stats?.byStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        STATUS_COLORS[
                          entry.status as keyof typeof STATUS_COLORS
                        ] || "#000000"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Applications
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats?.recentApplications.slice(0, 5).map((application, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {application.job_title}
                  </h4>
                  <p className="text-sm text-gray-500">{application.company}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize`}
                    style={{
                      backgroundColor: `${
                        STATUS_COLORS[
                          application.status as keyof typeof STATUS_COLORS
                        ]
                      }20`,
                      color:
                        STATUS_COLORS[
                          application.status as keyof typeof STATUS_COLORS
                        ],
                    }}
                  >
                    {application.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(
                      new Date(application.application_date),
                      "MMM d, yyyy"
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
