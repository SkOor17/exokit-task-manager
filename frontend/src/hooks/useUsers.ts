import { useQuery } from "@tanstack/react-query";
import { UsersService } from "@/services";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => UsersService.getAll(),
  });
}
