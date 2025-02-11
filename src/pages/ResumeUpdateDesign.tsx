// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { supabase } from '../lib/supabase';
// import { Plus, FileText, Download, Trash2, Edit2 } from 'lucide-react';
// import { format } from 'date-fns';
// import { useForm } from 'react-hook-form';

// interface Resume {
//   id: string;
//   title: string;
//   content: {
//     sections: {
//       type: string;
//       content: string;
//     }[];
//   };
//   created_at: string;
//   updated_at: string;
// }

// interface ResumeFormData {
//   title: string;
//   content: {
//     sections: {
//       type: string;
//       content: string;
//     }[];
//   };
// }

// const SECTION_TYPES = [
//   'summary',
//   'experience',
//   'education',
//   'skills',
//   'certifications',
//   'projects',
//   'awards',
// ];

// export function Resumes() {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingResume, setEditingResume] = useState<Resume | null>(null);
  
//   const queryClient = useQueryClient();
//   const { register, handleSubmit, reset, setValue, watch } = useForm<ResumeFormData>({
//     defaultValues: {
//       content: {
//         sections: [
//           { type: 'summary', content: '' },
//           { type: 'experience', content: '' },
//           { type: 'education', content: '' },
//           { type: 'skills', content: '' },
//         ],
//       },
//     },
//   });

//   const { data: resumes, isLoading } = useQuery({
//     queryKey: ['resumes'],
//     queryFn: async () => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('Not authenticated');

//       const { data, error } = await supabase
//         .from('resumes')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       return data as Resume[];
//     },
//   });

//   const createMutation = useMutation({
//     mutationFn: async (newResume: ResumeFormData) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('Not authenticated');

//       const { data, error } = await supabase
//         .from('resumes')
//         .insert([{ ...newResume, user_id: user.id }])
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['resumes'] });
//       setIsModalOpen(false);
//       reset();
//     },
//   });

//   const updateMutation = useMutation({
//     mutationFn: async (resume: Resume) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('Not authenticated');

//       const { data, error } = await supabase
//         .from('resumes')
//         .update({ ...resume, user_id: user.id })
//         .eq('id', resume.id)
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['resumes'] });
//       setIsModalOpen(false);
//       setEditingResume(null);
//       reset();
//     },
//   });

//   const deleteMutation = useMutation({
//     mutationFn: async (id: string) => {
//       const { error } = await supabase
//         .from('resumes')
//         .delete()
//         .eq('id', id);

//       if (error) throw error;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['resumes'] });
//     },
//   });

//   const onSubmit = (data: ResumeFormData) => {
//     if (editingResume) {
//       updateMutation.mutate({ ...editingResume, ...data });
//     } else {
//       createMutation.mutate(data);
//     }
//   };

//   const handleEdit = (resume: Resume) => {
//     setEditingResume(resume);
//     setValue('title', resume.title);
//     setValue('content', resume.content);
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (id: string) => {
//     if (window.confirm('Are you sure you want to delete this resume?')) {
//       deleteMutation.mutate(id);
//     }
//   };

//   const handleDownload = (resume: Resume) => {
//     const content = resume.content.sections
//       .map(section => `# ${section.type.toUpperCase()}\n\n${section.content}`)
//       .join('\n\n');
    
//     const blob = new Blob([content], { type: 'text/markdown' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `${resume.title}.md`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="py-3 flex justify-between items-center ">
//         <h1 className="text-3xl font-extrabold text-gray-900">Resumes</h1>
//         <button
//           onClick={() => {
//             setEditingResume(null);
//             reset();
//             setIsModalOpen(true);
//           }}
//           className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//         >
//           {/* <Plus className="h-4 w-4 mr-2" /> */}
//           <Plus className="h-4 w-4" />
//           {/* Create Resume */}
//         </button>
//       </div>

//       {/* Resumes Grid */}
//       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//         {resumes?.map((resume) => (
//           <div
//             key={resume.id}
//             className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
//           >
//             <div className="px-4 py-5 sm:px-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <FileText className="h-6 w-6 text-indigo-600" />
//                   <h3 className="ml-2 text-lg font-medium text-gray-900">{resume.title}</h3>
//                 </div>
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={() => handleDownload(resume)}
//                     className="p-1 text-gray-400 hover:text-gray-500"
//                   >
//                     <Download className="h-5 w-5" />
//                   </button>
//                   <button
//                     onClick={() => handleEdit(resume)}
//                     className="p-1 text-gray-400 hover:text-gray-500"
//                   >
//                     <Edit2 className="h-5 w-5" />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(resume.id)}
//                     className="p-1 text-gray-400 hover:text-gray-500"
//                   >
//                     <Trash2 className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>
//               <p className="mt-1 text-sm text-gray-500">
//                 Last updated {format(new Date(resume.updated_at), 'MMM d, yyyy')}
//               </p>
//             </div>
//             <div className="px-4 py-4 sm:px-6">
//               <div className="space-y-2">
//                 {resume.content.sections.map((section, index) => (
//                   <div key={index}>
//                     <h4 className="text-sm font-medium text-gray-500 capitalize">{section.type}</h4>
//                     <p className="mt-1 text-sm text-gray-900 line-clamp-2">{section.content}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Add/Edit Modal */}
//       {isModalOpen && (
//         <div className="fixed z-10 inset-0 overflow-y-auto">
//           <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

//             <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
//               <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Title</label>
//                   <input
//                     type="text"
//                     {...register('title')}
//                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                   />
//                 </div>

//                 {watch('content.sections').map((section, index) => (
//                   <div key={index}>
//                     <div className="flex justify-between items-center">
//                       <label className="block text-sm font-medium text-gray-700 capitalize">
//                         {section.type}
//                       </label>
//                       <select
//                         {...register(`content.sections.${index}.type`)}
//                         className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                       >
//                         {SECTION_TYPES.map(type => (
//                           <option key={type} value={type}>
//                             {type}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <textarea
//                       {...register(`content.sections.${index}.content`)}
//                       rows={4}
//                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                     ></textarea>
//                   </div>
//                 ))}

//                 <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
//                   <button
//                     type="submit"
//                     className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
//                   >
//                     {editingResume ? 'Update' : 'Create'}
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setIsModalOpen(false);
//                       setEditingResume(null);
//                       reset();
//                     }}
//                     className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Plus, FileText, Download, Trash2, Edit2 } from "lucide-react";
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
  profile_title: string;
  resume_description: string | null;
  resumeFile: File | null; // File input
}

export function Resumes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm<ResumeFormData>({
    defaultValues: {
      profile_title: "",
      resume_description: "",
      resumeFile: null,
    },
  });
  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files.length > 0) {
  //     setValue("resumeFile", e.target.files[0]); // Ensure only the first file is stored
  //     console.log(e.target.files[0])
  //   }
  // };

  // Create or Update Resume
  const createResumeMutation = useMutation({
    mutationFn: async (newResume: ResumeFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let resume_url: string | null = null;

      // If a file is provided, upload it to Supabase Storage
      if (newResume.resumeFile) {
        if (newResume.resumeFile instanceof FileList) {
          newResume.resumeFile = newResume.resumeFile[0]; // Extract the file
        }
        // console.log(newResume.resumeFile.name);
        const filePath = `resumes/${user.id}/${newResume.resumeFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, newResume.resumeFile);
        if (uploadError) throw uploadError;

        // Get the public URL for the uploaded file
        const { data } = await supabase.storage
          .from("resumes")
          .getPublicUrl(filePath);

        resume_url = data.publicUrl;
      }

      // Insert resume data into Supabase table
      const { data, error } = await supabase
        .from("resumes")
        .upsert([
          {
            profile_title: newResume.profile_title,
            resume_description: newResume.resume_description,
            resume_url,
            user_id: user.id,
          },
        ])
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

  const handleDownload = (resume: Resume) => {
    if (resume.resume_url) {
      window.open(resume.resume_url as string, "_blank");
    } else {
      alert("Resume not available for download.");
    }
  };

  const handleEdit = (resume: Resume) => {
    setEditingResume(resume);
    setValue("profile_title", resume.profile_title);
    setValue("resume_description", resume.resume_description);
    setIsModalOpen(true);
  };

  const handleDelete = async (resumeId: string) => {
    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId);
    if (error) {
      alert("Error deleting resume");
    } else {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Wrap createResumeMutation.mutate in a function to handle form submission
  const onSubmit: SubmitHandler<ResumeFormData> = (data) => {
    createResumeMutation.mutate(data);
  };

  return (
    <div>
      <div className="py-3 flex  justify-between items-center ">
        <h1 className="text-3xl font-extrabold text-gray-900">Resumes</h1>
        <button
          onClick={() => {
            setEditingResume(null);
            reset();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {/* <Plus className="h-4 w-4 mr-2" /> */}
          <Plus className="h-4 w-4" />
          {/* Create Resume */}
        </button>
      </div>
      <div className=" mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resumes?.map((resume) => (
          <div
            key={resume.id}
            className="bg-white p-4 border rounded-lg shadow-md"
          >
            <h2 className="text-lg font-semibold">{resume.profile_title}</h2>
            <p className="mt-2 text-gray-600">{resume.resume_description}</p>

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
              <button onClick={() => handleDownload(resume)}>
                <Download className="h-5 w-5" />
              </button>
              <button onClick={() => handleEdit(resume)}>
                <Edit2 className="h-5 w-5" />
              </button>
              <button onClick={() => handleDelete(resume.id)}>
                <Trash2 className="h-5 w-5" />
              </button>
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
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Title
                  </label>
                  <input
                    type="text"
                    {...register("profile_title")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register("resume_description")}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Resume
                  </label>
                  <input
                    type="file"
                    {...register("resumeFile")}
                    // onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500"
                  />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    {editingResume ? "Update" : "Create"}
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
