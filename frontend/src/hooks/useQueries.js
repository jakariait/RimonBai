import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "sonner";

const defaultQueryFn = async ({ queryKey }) => {
  const [url, params] = queryKey;
  const { data } = await api.get(url, { params });
  return data;
};

export function useFetch(url, params = {}, options = {}) {
  return useQuery({
    queryKey: [url, params],
    queryFn: defaultQueryFn,
    ...options,
  });
}

export function useCreate(url, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post(url, body);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Created successfully");
      options?.invalidate && queryClient.invalidateQueries({ queryKey: [options.invalidate] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Something went wrong");
    },
  });
}

export function useUpdate(url, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) => {
      const { data } = await api.put(`${url}/${id}`, body);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Updated successfully");
      options?.invalidate && queryClient.invalidateQueries({ queryKey: [options.invalidate] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Something went wrong");
    },
  });
}

export function useDelete(url, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`${url}/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Deleted successfully");
      options?.invalidate && queryClient.invalidateQueries({ queryKey: [options.invalidate] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Something went wrong");
    },
  });
}
