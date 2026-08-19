-- One-off data fix: assign the active Head of ICT as Project Supervisor
-- for the air-conditioner contract (CON-2026-0002) that was assigned
-- to the ICT department before the Head of ICT account existed.

update contracts
set project_supervisor_id = (
  select id
  from profiles
  where role = 'head_of_ict'
    and is_active = true
  order by created_at asc
  limit 1
)
where contract_number = 'CON-2026-0002'
  and project_supervisor_id is null;
