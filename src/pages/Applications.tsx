import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Plus, Search, Filter, Edit2, Trash2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
interface JobApplication {
  id: string;
  company: string;
  job_title: string;
  status: string;
  application_date: string; //changed string to date
  job_description?: string;
  job_url?: string;
  salary_min?: number;
  salary_max?: number;
  notes?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface ApplicationFormData {
  company: string;
  job_title: string;
  status: string;
  application_date: string;
  job_description?: string;
  job_url?: string;
  salary_min?: number;
  salary_max?: number;
  notes?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

const STATUS_COLORS = {
  saved: "bg-gray-100 text-gray-800",
  applied: "bg-indigo-100 text-indigo-800",
  interviewing: "bg-green-100 text-green-800",
  offered: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
  accepted: "bg-purple-100 text-purple-800",
  declined: "bg-pink-100 text-pink-800",
};

export function Applications() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingApplication, setEditingApplication] =
    useState<JobApplication | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExpand = (id: string) => {
    setExpandedId((prevId) => (prevId === id ? null : id));
  };
  // Form validation
  const schema = yup.object().shape({
    company: yup.string().required("Company is required"),
    job_title: yup.string().required("Job title is required"),
    status: yup.string().required("Status is required"),
    application_date: yup.string().required("Application date is required"),
    job_description: yup.string().optional(),
    job_url: yup.string().url("Invalid URL").optional(),
    salary_min: yup.number().optional(),
    salary_max: yup.number().optional(),
    notes: yup.string().optional(),
    contact_name: yup.string().optional(),
    contact_email: yup.string().email("Invalid email").optional(),
    contact_phone: yup.string().optional(),
  });

  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: yupResolver(schema),
    mode: "onBlur", // Validate on blur
  });

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("application_date", { ascending: false });

      if (error) throw error;
      return data as JobApplication[];
    },
  });
  //  creating new Job aplications
  const createMutation = useMutation({
    mutationFn: async (newApplication: ApplicationFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_applications")
        .insert([{ ...newApplication, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setIsModalOpen(false);
      reset();
    },
  });

  // Updating job aplications
  const updateMutation = useMutation({
    mutationFn: async (application: JobApplication) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_applications")
        .update({ ...application, user_id: user.id })
        .eq("id", application.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setIsModalOpen(false);
      setEditingApplication(null);
      reset();
    },
  });

  // Checking for pending response, if pending then showing loading spinner.
  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  // Add loading spinner component (can be placed anywhere in your component)
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    </div>
  );

  // Deleting aplications
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  // From submit
  const onSubmit = (data: ApplicationFormData) => {
    if (editingApplication) {
      updateMutation.mutate({ ...editingApplication, ...data });
      // console.log(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Setting fields with existing values and opening edit modal
  const handleEdit = (application: JobApplication) => {
    setEditingApplication(application);
    Object.entries(application).forEach(([key, value]) => {
      setValue(key as keyof ApplicationFormData, value);
    });
    setIsModalOpen(true);
  };

  // Delete confremation
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      deleteMutation.mutate(id);
    }
  };

  //Search bar functionality
  const filteredApplications = applications?.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // loading spinner for aplication section
  if (isLoading) {
    return (
      <div className="flex items-center mt-12 justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="py-3 mt-10 md:mt-0 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Job Applications
        </h1>
        {/* Add Application */}
        <button
          onClick={() => {
            setEditingApplication(null);
            reset();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {/* <Plus className="h-4 w-4 mr-2" /> */}
          <Plus className="h-4 w-4 " />
        </button>
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Status</option>
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>
      {/* Applications List */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredApplications?.map((application) => {
            const isExpanded = expandedId === application.id;

            return (
              <li key={application.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {application.job_title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {application.company}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col space-y-2  mt-2 text-center">
                        <span
                          className={`items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            STATUS_COLORS[
                              application.status as keyof typeof STATUS_COLORS
                            ]
                          }`}
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
                      {/* ...  edit/delete buttons and +/- button ... */}
                      <div className="flex flex-col space-y-2  mt-2 text-center">
                        <button
                          className="text-gray-400 hover:text-gray-500"
                          onClick={() => handleEdit(application)}
                        >
                          <Edit2 className="h-5 w-5 text-blue-500" />
                        </button>
                        <button
                          className="text-gray-400 border-t border-gray-300 pt-2 hover:text-gray-500"
                          onClick={() => handleDelete(application.id)}
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleExpand(application.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                      >
                        <span className="text-lg font-medium">
                          {isExpanded ? "−" : "+"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable details section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Job Details */}
                        <div className="space-y-2">
                          {application.job_description && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                Job Description
                              </h4>
                              <p className="text-sm text-gray-600">
                                {application.job_description}
                              </p>
                            </div>
                          )}
                          {application.job_url && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                Job URL
                              </h4>
                              <a
                                href={application.job_url}
                                className="text-sm text-blue-600 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {application.job_url}
                              </a>
                            </div>
                          )}
                          {(application.salary_min != 0 ||
                            application.salary_max != 0) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                Salary Range
                              </h4>
                              <p className="text-sm text-gray-600">
                                {application.salary_min !== 0 &&
                                  `${application.salary_min} LPA`}
                                {application.salary_max !== 0 &&
                                  ` - ${application.salary_max} LPA`}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Contact & Notes */}
                        <div className="space-y-2">
                          {(application.contact_name ||
                            application.contact_email ||
                            application.contact_phone) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                Contact Information
                              </h4>
                              <div className="text-sm text-gray-600">
                                {application.contact_name && (
                                  <p>{application.contact_name}</p>
                                )}
                                {application.contact_email && (
                                  <p>{application.contact_email}</p>
                                )}
                                {application.contact_phone && (
                                  <p>{application.contact_phone}</p>
                                )}
                              </div>
                            </div>
                          )}
                          {application.notes && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                Notes
                              </h4>
                              <p className="text-sm text-gray-600 whitespace-pre-line">
                                {application.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="w-full text-right">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingApplication(null);
                      reset();
                    }}
                  >
                    <XCircle className="w-6 h-6 text-orange-500"></XCircle>
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("company")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.company && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.company.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Job Title<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("job_title")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.job_title && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.job_title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("status")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                  </select>
                  {errors.status && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Application Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("application_date")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.application_date && (
                    // <p className="mt-2 text-sm text-red-600">{errors.application_date.message}</p>
                    <p className="mt-2 text-sm text-red-600">
                      Application date is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Job Description
                    <span className="text-gray-500"> (optional)</span>
                  </label>
                  <textarea
                    {...register("job_description")}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  ></textarea>
                  {errors.job_description && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.job_description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Job URL<span className="text-gray-500"> (optional)</span>
                  </label>
                  <input
                    type="url"
                    {...register("job_url")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.job_url && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.job_url.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Minimum Salary (LPA)
                    </label>
                    <input
                      type="number"
                      defaultValue={0}
                      {...register("salary_min")}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.salary_min && (
                      // <p className="mt-2 text-sm text-red-600">{errors.salary_min.message}</p>
                      <p className="mt-2 text-sm text-red-600">
                        Minimum salary must be a positive number
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Maximum Salary (LPA)
                    </label>
                    <input
                      type="number"
                      defaultValue={0}
                      {...register("salary_max")}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.salary_max && (
                      // <p className="mt-2 text-sm text-red-600">{errors.salary_max.message}</p>
                      <p className="mt-2 text-sm text-red-600">
                        Maximum salary must be a positive number
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes<span className="text-gray-500"> (optional)</span>
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  ></textarea>
                  {errors.notes && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.notes.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Name
                    <span className="text-gray-500"> (optional)</span>
                  </label>
                  <input
                    type="text"
                    {...register("contact_name")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.contact_name && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.contact_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Email
                    <span className="text-gray-500"> (optional)</span>
                  </label>
                  <input
                    type="email"
                    {...register("contact_email")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.contact_email && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.contact_email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Phone
                    <span className="text-gray-500"> (optional)</span>
                  </label>
                  <input
                    type="tel"
                    {...register("contact_phone")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.contact_phone && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.contact_phone.message}
                    </p>
                  )}
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <p className="text-sm">
                    <span className="text-red-500 text-sm">*</span> - Required
                    fields.
                  </p>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    disabled={Object.keys(errors).length > 0}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    {editingApplication ? (
                      isUpdating ? (
                        <div className="flex items-center">
                          <LoadingSpinner />
                          {/* <span className="ml-2">Updating...</span> */}
                        </div>
                      ) : (
                        "Update"
                      )
                    ) : isCreating ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        {/* <span className="ml-2">Updating...</span> */}
                      </div>
                    ) : (
                      "Create"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingApplication(null);
                      reset();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}{" "}
    </div>
  );
}
