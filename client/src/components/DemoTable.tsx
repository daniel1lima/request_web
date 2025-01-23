import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DemoTableRow } from "@/types";

interface DemoTableProps {
  data: DemoTableRow[];
  isLoading: boolean;
  error: string;
}

export function DemoTable({ data, isLoading, error }: DemoTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-destructive font-medium">{error}</div>
      </div>
    );
  }

  return (
      <Table>
        <TableHeader>
          <TableRow className="bg-white">
            <TableHead className="font-semibold">ID</TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            {/* Add other headers based on your DemoTableRow type */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow 
              key={row.id}
              className="bg-gray-300 hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-medium">{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              {/* Add other cells based on your DemoTableRow type */}
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell 
                colSpan={3} 
                className="h-24 text-center text-muted-foreground"
              >
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );
} 