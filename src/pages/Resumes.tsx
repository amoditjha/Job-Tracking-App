import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {
  Plus,

  Download,
  Trash2,
  Edit2,
  XCircle,
  Search,
} from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";

interface Resume {
  id: string;
  profile_title: string;
  resume_url: string | null;
  resume_description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ResumeFormData {
  id?: string;
  profile_title: string;
  resume_description: string | null;
  resumeFile?: File | null;
}

interface UpsertResumeData {
  id?: string; // Optional for new entries
  profile_title: string;
  resume_description: string | null;
  resume_url: string | null;
  user_id: string;
}

export function Resumes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  // Update the useForm initialization
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ResumeFormData>({
    defaultValues: {
      profile_title: "",
      resume_description: "",
      resumeFile: null,
    },
  });
  const generateRandomFileName = (file: File): string => {
    const randomString = Math.random().toString(36).substring(2, 15); // Random string
    const fileExtension = file.name.split(".").pop(); // Get the file extension
    return `${randomString}.${fileExtension}`; // Combine random string and extension
  };

  // Create or Update Resume
  const createResumeMutation = useMutation({
    mutationFn: async (newResume: ResumeFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // let resume_url: string | null = null;
      let resume_url: string | null = editingResume?.resume_url || null; // Preserve existing URL if no new file is uploaded

      // If a file is provided, upload it to Supabase Storage
      if (newResume.resumeFile) {
        if (newResume.resumeFile instanceof FileList) {
          newResume.resumeFile = newResume.resumeFile[0]; // Extract the file
        }
        const file = newResume.resumeFile; // Get the file from FileList
        const randomFileName = generateRandomFileName(file); // Generate a random file name
        const filePath = `resumes/${user.id}/${randomFileName}`; // Include user ID in the path
        // console.log(newResume.resumeFile.name);
        // const filePath = `resumes/${user.id}/${newResume.resumeFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, newResume.resumeFile);
        if (uploadError) {
          alert("Filed to upload the file");
          throw uploadError;
        }

        // Get the public URL for the uploaded file
        const { data } = await supabase.storage
          .from("resumes")
          .getPublicUrl(filePath);

        resume_url = data.publicUrl;
      }
      //  Prepare upsert data with proper typing
      const resumeData: UpsertResumeData = {
        profile_title: newResume.profile_title,
        resume_description: newResume.resume_description,
        resume_url,
        user_id: user.id,
      };

      // Include id only when editing
      if (newResume.id) {
        resumeData.id = newResume.id;
      }

      // Insert resume data into Supabase table
      const { data, error } = await supabase
        .from("resumes")
        .upsert([resumeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setIsModalOpen(false);
      reset();
    },
  });

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Resume[];
    },
  });

  // search filter
  const filteredResumes = resumes?.filter((resume) =>
    resume.profile_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const handleDownload = (resume: Resume) => {
  //   if (resume.resume_url) {
  //     window.open(resume.resume_url as string, "_blank");
  //   } else {
  //     alert("Resume not available for download.");
  //   }
  // };
  const handleDownload = async (resume: Resume) => {
    if (!resume.resume_url) {
      alert("Resume not available for download.");
      return;
    }

    try {
      // Fetch the file from the URL
      const response = await fetch(resume.resume_url);
      if (!response.ok) {
        throw new Error("Failed to fetch the file.");
      }

      // Convert the response to a blob
      const blob = await response.blob();

      // Create a temporary anchor element
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Set the download attribute with the desired file name
      const fileName = `Resume_${resume.profile_title.replace(
        /\s+/g,
        "_"
      )}.pdf`; // Customize the file name
      link.setAttribute("download", fileName);

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("An error occurred while downloading the file.");
    }
  };
  const handleEdit = (resume: Resume) => {
    setEditingResume(resume);
    setValue("id", resume.id);
    setValue("profile_title", resume.profile_title);
    setValue("resume_description", resume.resume_description);
    setValue("resumeFile", null); // Clear the file input
    setIsModalOpen(true);
  };

  // const handleDelete = async (resumeId: string) => {
  //   const confirmDelete = window.confirm(
  //     "Are you sure you want to delete this resume?"
  //   );

  //   if (!confirmDelete) return; // If the user cancels, do nothing

  //   const { error } = await supabase
  //     .from("resumes")
  //     .delete()
  //     .eq("id", resumeId);

  //   if (error) {
  //     alert("Error deleting resume");
  //   } else {
  //     queryClient.invalidateQueries({ queryKey: ["resumes"] });
  //   }
  // };
  const handleDelete = async (resume: Resume) => {
    if (window.confirm("Are you sure you want to delete this resume")) {
      try {
        // 1. Verify the resume_url
        if (!resume.resume_url) {
          throw new Error("No file associated with this resume.");
        }

        // 2. Extract the file path correctly
        const url = new URL(resume.resume_url);
        // const filePath = url.pathname.split("/storage/v1/object/public/resumes/")[1];
        const filePath = url.pathname.split("/resumes/")[1];
        // console.log(filePath, "487eb7f7-67c6-4f17-972d-d976cec1468d")
        // console.log( "487eb7f7-67c6-4f17-972d-d976cec1468d")

        if (!filePath) {
          throw new Error("Unable to extract file path from URL.");
        }

        // 3. Delete the file from storage
        const { error: storageError } = await supabase.storage
          .from("resumes")
          .remove([`resumes/${filePath}`]);

        if (storageError) {
          throw storageError;
        }

        // 4. Delete the record from the database
        const { error: deleteError } = await supabase
          .from("resumes")
          .delete()
          .eq("id", resume.id);
        // console.log(resume.id)
        if (deleteError) {
          throw deleteError;
        }

        // 5. Refresh the UI
        queryClient.invalidateQueries({ queryKey: ["resumes"] });
        alert("Resume and file deleted successfully!");
      } catch (error) {
        console.error("Delete Error:", error);
        alert(`Error deleting resume`);
      }
    }
  };

  const handleDeleteFile = async () => {
    if (editingResume?.resume_url) {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete the file?"
      );

      if (!confirmDelete) return;
      // Delete the file from Supabase Storage
      const filePath = editingResume.resume_url.split("/resumes/")[1];
      console.log("File Path:", filePath); // Log the file path for debugging
      console.log("complete path:", editingResume.resume_url);
      console.log(editingResume.resume_url.split("/resumes/")[0]);
      const { error } = await supabase.storage
        .from("resumes")
        .remove([filePath]);

      if (error) {
        alert("Error deleting file");
      } else {
        // Update the resume record to remove the URL
        const { error: updateError } = await supabase
          .from("resumes")
          .update({ resume_url: null })
          .eq("id", editingResume.id);

        if (updateError) {
          alert("Error updating resume");
        } else {
          queryClient.invalidateQueries({ queryKey: ["resumes"] });
          setEditingResume({ ...editingResume, resume_url: null }); // Update local state
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center mt-12 justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Get the mutation status
  const isUpdating = createResumeMutation.isPending;

  // Add loading spinner component (can be placed anywhere in your component)
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    </div>
  );

  // Wrap createResumeMutation.mutate in a function to handle form submission
  const onSubmit: SubmitHandler<ResumeFormData> = (data) => {
    createResumeMutation.mutate(data);
  };

  return (
    <div className="h-full">
      <div className="py-3 mt-10 md:mt-0 flex  justify-between items-center ">
        <h1 className="text-3xl font-extrabold text-gray-900">Resumes</h1>
        <button
          onClick={() => {
            setEditingResume(null);
            reset({
              // Reset form with default values
              profile_title: "",
              resume_description: "",
              resumeFile: null,
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {/* <Plus className="h-4 w-4 mr-2" /> */}
          <Plus className="h-4 w-4" />
          {/* Create Resume */}
        </button>
      </div>
      {/* Search Filters */}

      <div className="flex-1">
        <div className="relative max-w-[24.5rem] ">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search resumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      {/* resume containers */}
      <div className=" mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResumes?.map((resume) => (
          <div
            key={resume.id}
            className="bg-white p-4 border rounded-lg shadow-md"
          >
            <h2 className="text-lg font-semibold">{resume.profile_title}</h2>
            <p className="mt-2 text-gray-600 line-clamp-2 text-sm break-words max-h-30 min-h-14">
              {resume.resume_description}
            </p>

            {resume.resume_url && (
              <div className="mt-4">
                <a
                  href={resume.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="text-blue-500">View Resume</button>
                </a>
              </div>
            )}

            <div className="mt-4 flex space-x-2">
              <div className="border-r pr-3 border-gray-500">
                <button className="" onClick={() => handleDownload(resume)}>
                  <Download className="h-5 w-5 text-green-500" />
                </button>
              </div>
              <div className="">
                <button onClick={() => handleEdit(resume)}>
                  <Edit2 className="h-5 w-5 text-blue-500" />
                </button>
              </div>
              <div className="border-l  pl-3 border-gray-500">
                <button onClick={() => handleDelete(resume)}>
                  <Trash2 className="h-5 w-5 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Resume Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <div className="w-full text-right">
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        reset();
                      }}
                    >
                      <XCircle className="w-6 h-6 text-orange-500"></XCircle>
                    </button>
                  </div>
                  {/* Profile Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Profile Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("profile_title", {
                        required: "Profile title is required",
                        maxLength: {
                          value: 20,
                          message: "Title cannot exceed 20 characters",
                        },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.profile_title && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.profile_title.message}
                      </p>
                    )}
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    {...register("resume_description", {
                      maxLength: {
                        value: 250,
                        message: "Description cannot exceed 250 characters",
                      },
                    })}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  ></textarea>
                  {errors.resume_description && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.resume_description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Resume<span className="text-red-500">*</span><span className="text-gray-500 font-normal"> (Only .PDF, .DOC, .DOCX are allowed)</span>
                  </label>
                  {!editingResume ? (
                    <input
                      type="file"
                      accept=".pdf, .doc, .docx"
                      {...register("resumeFile", {
                        required: "File is required",
                      })}
                      // onChange={handleFileChange}
                      className="mt-1 block w-full text-sm text-gray-500"
                    />
                  ) : (
                    <input
                      type="file"
                      accept=".pdf, .doc, .docx"
                      {...register("resumeFile")}
                      // onChange={handleFileChange}
                      className="mt-1 block w-full text-sm text-gray-500"
                    />
                  )}
                  {/* <input
                    type="file"
                    {...register("resumeFile", {
                      required: "File is required",
                    })}
                    // onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500"
                  /> */}
                  {errors.resumeFile && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.resumeFile.message}
                    </p>
                  )}
                </div>

                {editingResume?.resume_url && (
                  <button
                    type="button"
                    onClick={handleDeleteFile}
                    className="mt-2 text-sm text-red-500 hover:text-red-700 hidden"
                  >
                    Delete Existing File
                  </button>
                )}
                <p className=" text-sm font-thin">
                  <span className="text-red-500 font-bold">*</span>Field is required{" "}
                </p>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  {/* <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    {editingResume ? "Update" : "Create"}
                  </button> */}
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm ${
                      isUpdating ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUpdating ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        {/* <span className="ml-2">Updating...</span> */}
                      </div>
                    ) : editingResume ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
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
      )}
    </div>
  );
}
