import { useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import DataTable from "@/components/admin/DataTable";
import FilterBar, { FilterSelect } from "@/components/admin/FilterBar";
import PageHeader from "@/components/admin/PageHeader";
import { ViewAction } from "@/components/admin/TableActions";
import Pagination from "@/components/admin/Pagination";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/ui/badge/Badge";
import { useApi } from "@/hooks/useApi";
import { useListQuery } from "@/hooks/useListQuery";
import { http } from "@/lib/api";
import { date } from "@/lib/format";
import type { ContactMessage, Paginated } from "@/types/api";
import MessageDetailModal from "./MessageDetailModal";

type MessagePage = Paginated<ContactMessage> & { unread_count: number };

/** Inbox for messages sent from the storefront Contact Us form. */
export default function MessageList() {
  const { values, page, set } = useListQuery(["q", "status"] as const);
  const { data, error, loading, reload } = useApi(
    () => http.get<MessagePage>("/admin/messages", { q: values.q, status: values.status, page, per_page: 20 }),
    [values, page],
  );
  const [openId, setOpenId] = useState<number | null>(null);

  const description = data
    ? `${data.meta.total} message${data.meta.total === 1 ? "" : "s"}${data.unread_count ? ` · ${data.unread_count} unread` : ""}. Sent from the storefront Contact Us page.`
    : "Messages sent from the storefront Contact Us page.";

  return (
    <>
      <PageMeta title="Messages | Anaya Collection Admin" description="Contact form submissions from the storefront." />
      <PageHeader title="Messages" description={description} />
      <Card bodyClassName="p-4 md:p-5">
        <FilterBar search={values.q} onSearch={(q) => set("q", q)} placeholder="Name, email, phone or text">
          <FilterSelect
            label="Status"
            value={values.status}
            onChange={(v) => set("status", v)}
            options={[
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ]}
          />
        </FilterBar>
        <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)} empty={data?.data.length === 0} emptyTitle="No messages found.">
          {data && (
            <>
              <DataTable
                caption="Contact messages"
                rows={data.data}
                rowKey={(m) => m.id}
                columns={[
                  {
                    key: "from",
                    header: "From",
                    cell: (m) => (
                      <div className="min-w-40">
                        <button
                          type="button"
                          onClick={() => setOpenId(m.id)}
                          className={`text-start hover:text-brand-500 ${m.is_read ? "font-medium text-gray-700 dark:text-gray-300" : "font-semibold text-gray-900 dark:text-white"}`}
                        >
                          {m.name}
                        </button>
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">{m.email}</p>
                        {m.phone && <p className="text-theme-xs text-gray-500 dark:text-gray-400">{m.phone}</p>}
                      </div>
                    ),
                  },
                  {
                    key: "message",
                    header: "Message",
                    cell: (m) => (
                      <button type="button" onClick={() => setOpenId(m.id)} className="block max-w-md text-start">
                        {m.subject && <span className={`block truncate ${m.is_read ? "text-gray-700 dark:text-gray-300" : "font-semibold text-gray-900 dark:text-white"}`}>{m.subject}</span>}
                        <span className="line-clamp-2 text-theme-xs text-gray-500 dark:text-gray-400">{m.message}</span>
                      </button>
                    ),
                  },
                  { key: "received", header: "Received", cell: (m) => <span className="whitespace-nowrap">{date(m.created_at, true)}</span> },
                  {
                    key: "status",
                    header: "Status",
                    cell: (m) => (
                      <Badge size="sm" color={m.is_read ? "light" : "warning"}>
                        {m.is_read ? "Read" : "New"}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    header: <span className="sr-only">Actions</span>,
                    align: "end",
                    cell: (m) => (
                      <ViewAction onClick={() => setOpenId(m.id)} />
                    ),
                  },
                ]}
              />
              <Pagination meta={data.meta} onPage={(p) => set("page", p)} />
            </>
          )}
        </DataState>
      </Card>

      <MessageDetailModal
        id={openId}
        onClose={() => setOpenId(null)}
        onChanged={reload}
      />
    </>
  );
}
