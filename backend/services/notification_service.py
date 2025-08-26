import os
from typing import Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

load_dotenv()

class NotificationService:
    def __init__(self):
        # SendGrid configuration
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.sendgrid_from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@bournemoutheats.com")
        
        # Twilio configuration
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_from_number = os.getenv("TWILIO_FROM_NUMBER")
        
        # Initialize clients
        self.sendgrid_client = None
        self.twilio_client = None
        
        if self.sendgrid_api_key:
            self.sendgrid_client = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
        
        if self.twilio_account_sid and self.twilio_auth_token:
            self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        template_id: Optional[str] = None,
        dynamic_data: Optional[Dict] = None
    ) -> Dict[str, any]:
        """
        Send email using SendGrid
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            content: Email content (HTML or plain text)
            template_id: SendGrid template ID (optional)
            dynamic_data: Dynamic data for template (optional)
        
        Returns:
            Dictionary with success status and message
        """
        if not self.sendgrid_client:
            return {
                "success": False,
                "error": "SendGrid not configured",
                "message": "SendGrid API key not provided"
            }
        
        try:
            from_email = Email(self.sendgrid_from_email)
            to_email_obj = To(to_email)
            
            if template_id and dynamic_data:
                # Use SendGrid template
                mail = Mail(
                    from_email=from_email,
                    to_emails=to_email_obj,
                    subject=subject
                )
                mail.template_id = template_id
                mail.dynamic_template_data = dynamic_data
            else:
                # Use custom content
                content_obj = Content("text/html", content)
                mail = Mail(
                    from_email=from_email,
                    to_emails=to_email_obj,
                    subject=subject,
                    html_content=content_obj
                )
            
            response = self.sendgrid_client.send(mail)
            
            return {
                "success": True,
                "message": "Email sent successfully",
                "status_code": response.status_code,
                "message_id": response.headers.get('X-Message-Id')
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send email"
            }
    
    async def send_sms(
        self,
        to_number: str,
        message: str
    ) -> Dict[str, any]:
        """
        Send SMS using Twilio
        
        Args:
            to_number: Recipient phone number (with country code)
            message: SMS message content
        
        Returns:
            Dictionary with success status and message
        """
        if not self.twilio_client:
            return {
                "success": False,
                "error": "Twilio not configured",
                "message": "Twilio credentials not provided"
            }
        
        try:
            message_obj = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_from_number,
                to=to_number
            )
            
            return {
                "success": True,
                "message": "SMS sent successfully",
                "message_sid": message_obj.sid,
                "status": message_obj.status
            }
            
        except TwilioException as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send SMS"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Unexpected error sending SMS"
            }
    
    async def send_order_confirmation(
        self,
        rider_email: str,
        rider_phone: str,
        order_data: Dict
    ) -> Dict[str, any]:
        """
        Send order confirmation to rider
        
        Args:
            rider_email: Rider's email address
            rider_phone: Rider's phone number
            order_data: Order information
        
        Returns:
            Dictionary with notification results
        """
        results = {
            "email_sent": False,
            "sms_sent": False,
            "errors": []
        }
        
        # Send email confirmation
        subject = f"Order Confirmation - #{order_data.get('order_id', 'N/A')}"
        email_content = self._generate_order_confirmation_email(order_data)
        
        email_result = await self.send_email(
            to_email=rider_email,
            subject=subject,
            content=email_content
        )
        
        if email_result["success"]:
            results["email_sent"] = True
        else:
            results["errors"].append(f"Email failed: {email_result.get('error', 'Unknown error')}")
        
        # Send SMS confirmation
        sms_message = self._generate_order_confirmation_sms(order_data)
        
        sms_result = await self.send_sms(
            to_number=rider_phone,
            message=sms_message
        )
        
        if sms_result["success"]:
            results["sms_sent"] = True
        else:
            results["errors"].append(f"SMS failed: {sms_result.get('error', 'Unknown error')}")
        
        return results
    
    async def send_order_status_update(
        self,
        rider_email: str,
        rider_phone: str,
        order_id: str,
        status: str,
        additional_info: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Send order status update to rider
        
        Args:
            rider_email: Rider's email address
            rider_phone: Rider's phone number
            order_id: Order ID
            status: New order status
            additional_info: Additional information (optional)
        
        Returns:
            Dictionary with notification results
        """
        results = {
            "email_sent": False,
            "sms_sent": False,
            "errors": []
        }
        
        # Send email update
        subject = f"Order #{order_id} Status Update - {status.title()}"
        email_content = self._generate_status_update_email(order_id, status, additional_info)
        
        email_result = await self.send_email(
            to_email=rider_email,
            subject=subject,
            content=email_content
        )
        
        if email_result["success"]:
            results["email_sent"] = True
        else:
            results["errors"].append(f"Email failed: {email_result.get('error', 'Unknown error')}")
        
        # Send SMS update
        sms_message = self._generate_status_update_sms(order_id, status, additional_info)
        
        sms_result = await self.send_sms(
            to_number=rider_phone,
            message=sms_message
        )
        
        if sms_result["success"]:
            results["sms_sent"] = True
        else:
            results["errors"].append(f"SMS failed: {sms_result.get('error', 'Unknown error')}")
        
        return results
    
    async def send_payment_notification(
        self,
        rider_email: str,
        rider_phone: str,
        payment_data: Dict
    ) -> Dict[str, any]:
        """
        Send payment notification to rider
        
        Args:
            rider_email: Rider's email address
            rider_phone: Rider's phone number
            payment_data: Payment information
        
        Returns:
            Dictionary with notification results
        """
        results = {
            "email_sent": False,
            "sms_sent": False,
            "errors": []
        }
        
        # Send email notification
        subject = f"Payment Received - £{payment_data.get('amount', 0):.2f}"
        email_content = self._generate_payment_email(payment_data)
        
        email_result = await self.send_email(
            to_email=rider_email,
            subject=subject,
            content=email_content
        )
        
        if email_result["success"]:
            results["email_sent"] = True
        else:
            results["errors"].append(f"Email failed: {email_result.get('error', 'Unknown error')}")
        
        # Send SMS notification
        sms_message = self._generate_payment_sms(payment_data)
        
        sms_result = await self.send_sms(
            to_number=rider_phone,
            message=sms_message
        )
        
        if sms_result["success"]:
            results["sms_sent"] = True
        else:
            results["errors"].append(f"SMS failed: {sms_result.get('error', 'Unknown error')}")
        
        return results
    
    async def send_incident_alert(
        self,
        admin_emails: List[str],
        incident_data: Dict
    ) -> Dict[str, any]:
        """
        Send incident alert to admins
        
        Args:
            admin_emails: List of admin email addresses
            incident_data: Incident information
        
        Returns:
            Dictionary with notification results
        """
        results = {
            "emails_sent": 0,
            "total_emails": len(admin_emails),
            "errors": []
        }
        
        subject = f"Incident Alert - {incident_data.get('type', 'Unknown')}"
        email_content = self._generate_incident_alert_email(incident_data)
        
        for admin_email in admin_emails:
            email_result = await self.send_email(
                to_email=admin_email,
                subject=subject,
                content=email_content
            )
            
            if email_result["success"]:
                results["emails_sent"] += 1
            else:
                results["errors"].append(f"Email to {admin_email} failed: {email_result.get('error', 'Unknown error')}")
        
        return results
    
    def _generate_order_confirmation_email(self, order_data: Dict) -> str:
        """Generate HTML email content for order confirmation"""
        return f"""
        <html>
        <body>
            <h2>Order Confirmation</h2>
            <p>Hello {order_data.get('rider_name', 'Rider')},</p>
            <p>Your order has been confirmed and assigned to you.</p>
            
            <h3>Order Details:</h3>
            <ul>
                <li><strong>Order ID:</strong> {order_data.get('order_id', 'N/A')}</li>
                <li><strong>Restaurant:</strong> {order_data.get('restaurant_name', 'N/A')}</li>
                <li><strong>Pickup Address:</strong> {order_data.get('pickup_address', 'N/A')}</li>
                <li><strong>Delivery Address:</strong> {order_data.get('delivery_address', 'N/A')}</li>
                <li><strong>Estimated Distance:</strong> {order_data.get('distance_km', 0)} km</li>
                <li><strong>Estimated Time:</strong> {order_data.get('estimated_time', 0)} minutes</li>
            </ul>
            
            <p>Please proceed to the restaurant to pick up the order.</p>
            
            <p>Best regards,<br>BournemouthEats Team</p>
        </body>
        </html>
        """
    
    def _generate_order_confirmation_sms(self, order_data: Dict) -> str:
        """Generate SMS content for order confirmation"""
        return f"Order #{order_data.get('order_id', 'N/A')} confirmed! Pickup: {order_data.get('restaurant_name', 'Restaurant')}. Delivery: {order_data.get('delivery_address', 'Address')}. Est. time: {order_data.get('estimated_time', 0)}min."
    
    def _generate_status_update_email(self, order_id: str, status: str, additional_info: Optional[str]) -> str:
        """Generate HTML email content for status update"""
        content = f"""
        <html>
        <body>
            <h2>Order Status Update</h2>
            <p>Your order status has been updated.</p>
            
            <h3>Update Details:</h3>
            <ul>
                <li><strong>Order ID:</strong> {order_id}</li>
                <li><strong>New Status:</strong> {status.title()}</li>
        """
        
        if additional_info:
            content += f"<li><strong>Additional Info:</strong> {additional_info}</li>"
        
        content += """
            </ul>
            
            <p>Please check your dashboard for more details.</p>
            
            <p>Best regards,<br>BournemouthEats Team</p>
        </body>
        </html>
        """
        
        return content
    
    def _generate_status_update_sms(self, order_id: str, status: str, additional_info: Optional[str]) -> str:
        """Generate SMS content for status update"""
        message = f"Order #{order_id} status: {status.title()}"
        if additional_info:
            message += f" - {additional_info}"
        return message
    
    def _generate_payment_email(self, payment_data: Dict) -> str:
        """Generate HTML email content for payment notification"""
        return f"""
        <html>
        <body>
            <h2>Payment Received</h2>
            <p>Hello {payment_data.get('rider_name', 'Rider')},</p>
            <p>Your payment has been processed successfully.</p>
            
            <h3>Payment Details:</h3>
            <ul>
                <li><strong>Amount:</strong> £{payment_data.get('amount', 0):.2f}</li>
                <li><strong>Payment Date:</strong> {payment_data.get('date', 'N/A')}</li>
                <li><strong>Payment Type:</strong> {payment_data.get('type', 'N/A')}</li>
                <li><strong>Reference:</strong> {payment_data.get('reference', 'N/A')}</li>
            </ul>
            
            <p>The payment will be transferred to your registered bank account within 2-3 business days.</p>
            
            <p>Best regards,<br>BournemouthEats Team</p>
        </body>
        </html>
        """
    
    def _generate_payment_sms(self, payment_data: Dict) -> str:
        """Generate SMS content for payment notification"""
        return f"Payment received: £{payment_data.get('amount', 0):.2f} for {payment_data.get('type', 'delivery')}. Reference: {payment_data.get('reference', 'N/A')}. Will be transferred to your bank account in 2-3 business days."
    
    def _generate_incident_alert_email(self, incident_data: Dict) -> str:
        """Generate HTML email content for incident alert"""
        return f"""
        <html>
        <body>
            <h2>Incident Alert</h2>
            <p>A new incident has been reported that requires your attention.</p>
            
            <h3>Incident Details:</h3>
            <ul>
                <li><strong>Type:</strong> {incident_data.get('type', 'Unknown')}</li>
                <li><strong>Severity:</strong> {incident_data.get('severity', 'Unknown')}</li>
                <li><strong>Description:</strong> {incident_data.get('description', 'N/A')}</li>
                <li><strong>Order ID:</strong> {incident_data.get('order_id', 'N/A')}</li>
                <li><strong>Rider ID:</strong> {incident_data.get('rider_id', 'N/A')}</li>
                <li><strong>Reported At:</strong> {incident_data.get('reported_at', 'N/A')}</li>
            </ul>
            
            <p>Please log into the admin dashboard to review and resolve this incident.</p>
            
            <p>Best regards,<br>BournemouthEats System</p>
        </body>
        </html>
        """
    
    def is_configured(self) -> Dict[str, bool]:
        """Check if notification services are configured"""
        return {
            "sendgrid": bool(self.sendgrid_api_key),
            "twilio": bool(self.twilio_account_sid and self.twilio_auth_token)
        }

# Create global instance
notification_service = NotificationService()
