# set the path
env :PATH, ENV['PATH']
# set the output
#set :output, 'log/crontab.log'

# run the auto-update rake task on a schedule
every 5.minutes do
  rake "auto_update:run"
end
