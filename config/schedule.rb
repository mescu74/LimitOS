# run the auto-update rake task on a schedule
every 1.minute do
  rake "auto_update:run"
end
