class DevicesController < ApplicationController

  # send a message to the device
  # params[:message] should be a hash
  def send_message
    # broadcast to "device:X"
    DevicesChannel.broadcast_to(
      'X',
      params[:message].merge({ time: (Time.now.to_f * 1000).to_i })
    )
    head :ok
  end

end