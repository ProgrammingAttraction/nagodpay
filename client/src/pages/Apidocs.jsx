import React from 'react';

const Apidocs = () => {
  return (
    <section className='p-[10px] md:p-[40px] lg:p-[100px] flex justify-center items-center font-fira bg-gray-50'>
      <div className="p-6 text-sm md:text-base leading-relaxed space-y-4 w-full border-[1px] border-gray-200 shadow-md bg-white">
        <h1 className="text-2xl font-bold text-center text-gray-800">NagodPay Payment API Documentation</h1>
<section className="prose prose-indigo max-w-none">
  <h2 className="text-2xl font-bold text-gray-800">1. Create Payment (P2P)</h2>


  <h3 className="text-xl font-semibold mt-6">Endpoint</h3>
  <p><strong>Post:</strong> <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">https://api.nagodpay.com/api/payment/payment</code></p>
<div>
  <h2>Description</h2>
    <p>
    This API initiates peer-to-peer (P2P) payment requests via supported mobile financial services 
    such as <strong>bKash</strong> and <strong>Nagad</strong>, intended for registered and active merchants.
    It validates inputs, checks merchant status, and returns a secure payment link for users 
    to complete their transaction.
  </p>
</div>
  <h3 className="text-xl font-semibold mt-6">🛡️ Headers</h3>
  <div className="overflow-x-auto">
    <table className="min-w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-3 text-left">Key</th>
          <th className="border p-3 text-left">Type</th>
          <th className="border p-3 text-left">Required</th>
          <th className="border p-3 text-left">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border p-3">x-api-key</td>
          <td className="border p-3">String</td>
          <td className="border p-3">✅ Yes</td>
          <td className="border p-3">Merchant's unique API key</td>
        </tr>
      </tbody>
    </table>
  </div>
    <h4 className="text-xl font-semibold text-gray-800">Field Descriptions</h4>

<div className="overflow-x-auto mt-2"> <table className="min-w-full border text-sm"> <thead className="bg-gray-100"> <tr> 
    <th className="border p-2 text-left">Field</th> <th className="border p-2 text-left">Type</th> 
    <th className="border p-2 text-left">Required</th> <th className="border p-2 text-left">Description</th>
     </tr> </thead> <tbody> <tr> <td className="border p-2">provider</td> <td className="border p-2">String</td> 
     <td className="border p-2">✅ Yes</td> <td className="border p-2">MFS provider name (e.g., <code>bkash</code>, 
     <code>nagad</code>)</td> </tr> <tr> <td className="border p-2">amount</td> <td className="border p-2">Number</td> 
     <td className="border p-2">✅ Yes</td> <td className="border p-2">Payment amount (must be ≥ minimum)</td> </tr>  <tr> <td className="border p-2">orderId</td> <td className="border p-2">String</td> <td className="border p-2">✅ Yes</td> <td className="border p-2">Unique order reference</td> </tr> <tr> <td className="border p-2">currency</td> <td className="border p-2">String</td> <td className="border p-2">✅ Yes</td> <td className="border p-2">Currency code (e.g., <code>BDT</code>, <code>INR</code>, <code>USD</code>)</td> </tr> <tr> <td className="border p-2">payerId</td> <td className="border p-2">String</td> <td className="border p-2">✅ Yes</td> <td className="border p-2">User/player/customer identifier</td> </tr> <tr> <td className="border p-2">redirectUrl</td> <td className="border p-2">String (URL)</td> <td className="border p-2">✅ Yes</td> <td className="border p-2">User will be redirected here after payment</td> </tr> <tr> <td className="border p-2">callbackUrl</td> <td className="border p-2">String (URL)</td> <td className="border p-2">✅ Yes</td> <td className="border p-2">Server endpoint to receive payment status updates (webhook)</td> </tr> </tbody> </table> </div>
  <h3 className="text-xl font-semibold mt-6">📤 Request Body</h3>
  <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-sm leading-relaxed">
{`{
  "provider": "bkash",               // Required: Payment provider (bkash, nagad)
  "amount": 400,                     // Required: Payment amount
  "orderId": "AkWjV-EU",             // Required: Unique order ID
  "currency": "BDT",                 // Required: Currency (BDT, INR, USD)
  "payerId": "F8C549",               // Required: Payer or user ID
  "redirectUrl": "http://localhost:5173", // Required: Client redirect URL
  "callbackUrl": "http://localhost:8080/admin/deposit-success" // Optional: Server notification URL
}`}
  </pre>



  <section className="prose prose-indigo max-w-none">

  <h3 className="text-xl font-semibold mt-6">✅ Success Response (200)</h3>
  <pre className="bg-green-900 text-green-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "success": true,
  "message": "Payment link created.",
  "orderId": "AkWjV-EU",
  "paymentId": "eF9mJc3V",
  "link": "http://localhost:3000/checkout/eF9mJc3V"
}`}
  </pre>

  <h3 className="text-xl font-semibold mt-6">🔄 Redirection</h3>
  <p>
    Upon receiving a successful response, your application should immediately redirect the user 
    to the provided <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">link</code> 
    from the response data to complete the payment process.
  </p>


</section>
</section>




      <section className="mt-10 space-y-8">
  <h2 className="text-3xl font-bold text-gray-800">2. Create Payout</h2>

  {/* Endpoint */}
  <div>
    <h3 className="text-xl font-[600] text-gray-800">Endpoint</h3>
    <p className="mt-2 text-sm">
      <strong>POST:</strong>{" "}
      <code className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-mono">
        https://api.pi2payz.com/api/payment/payout
      </code>
    </p>
  </div>

  {/* Description */}
  <div>
    <h3 className="text-xl font-semibold text-gray-700">Description</h3>
    <p className="mt-2 text-gray-700 leading-relaxed">
      This API allows merchants to request payouts (withdrawals) for their users. The system assigns each payout request 
      to an available agent with sufficient balance and provides tracking through a unique payment ID.
    </p>
  </div>

  {/* Headers */}
  <div>
    <h3 className="text-xl font-semibold text-gray-800">Headers</h3>
    <div className="overflow-x-auto mt-2">
      <table className="min-w-full border border-gray-300 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Key</th>
            <th className="border px-4 py-2">Type</th>
            <th className="border px-4 py-2">Required</th>
            <th className="border px-4 py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-white">
            <td className="border px-4 py-2">x-api-key</td>
            <td className="border px-4 py-2">String</td>
            <td className="border px-4 py-2">✅ Yes</td>
            <td className="border px-4 py-2">Merchant's unique API key</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  {/* Field Descriptions */}
  <div>
    <h4 className="text-xl font-semibold text-indigo-600 mt-4">Field Descriptions</h4>
    <div className="overflow-x-auto mt-2">
      <table className="min-w-full border border-gray-300 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Parameter</th>
            <th className="border px-4 py-2">Type</th>
            <th className="border px-4 py-2">Required</th>
            <th className="border px-4 py-2">Description</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {[
            ['provider', 'string', 'Yes', 'Payment provider (e.g., "bkash", "nagad", "bank")'],
            ['orderId', 'string', 'Yes', 'Unique order ID randomly generated (used for duplicate checking)'],
            ['payeeId', 'string', 'Yes', "User/player/customer identifier"],
            ['payeeAccount', 'string', 'Yes', "Recipient's account number/wallet number"],
            ['callbackUrl', 'string', 'Yes', 'URL where payout status updates will be sent'],
            ['amount', 'number', 'Yes', 'Payout amount (must meet currency-specific limits)'],
            ['currency', 'string', 'Yes', 'Currency code (BDT, INR, or USD)'],
          ].map(([param, type, required, desc], i) => (
            <tr key={i}>
              <td className="border px-4 py-2">{param}</td>
              <td className="border px-4 py-2">{type}</td>
              <td className="border px-4 py-2">{required}</td>
              <td className="border px-4 py-2">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  {/* Request Body */}
  <div>
    <h3 className="text-xl font-semibold text-gray-800"> Request Body</h3>
    <pre className="bg-gray-900 text-green-200 p-4 rounded text-sm overflow-x-auto mt-2">
{`{
  "provider": "bkash",
  "orderId": "A7Bh3D",
  "payeeId": "5F2154",
  "payeeAccount": "recipient_account",
  "callbackUrl": "https://merchant.com/callback",
  "amount": "100.00",
  "currency": "BDT"
}`}
    </pre>
  </div>



  {/* Success Response */}
  <div>
    <h3 className="text-2xl font-semibold text-indigo-700">✅ Success Response (200)</h3>
    <pre className="bg-green-900 text-green-100 p-4 rounded text-sm overflow-x-auto mt-2">
{`{
  "success": true,
  "message": "Payout request received and assigned to an agent.",
  "orderId": "unique_order_id",
  "link": "https://merchant.com/callback",
  "paymentId": "ABC123XYZ",
  "assignedAgent": "agent_name"
}`}
    </pre>
  </div>
</section>

{/* 
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800">🔄 Change Payout Status API Documentation</h2>
          <h3 className="font-semibold mt-2">Overview</h3>
          <p>
            This API allows administrators to update the status of a payout transaction. It handles status changes, 
            agent balance updates, commission calculations, and notifications.
          </p>

          <h3 className="font-semibold mt-4">Base URL</h3>
          <p><code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">https://api.nagodpay.com/api/payment/changePayoutStatus</code></p>

          <h3 className="font-semibold mt-4">Authentication</h3>
          <p>Requires admin/agent authentication (implied by admin_name parameter)</p>
          <p>Frontend should include agent/admin credentials in the request</p>

          <h3 className="font-semibold mt-4">Request</h3>
          <p><strong>HTTP Method:</strong> POST</p>

          <h4 className="font-semibold mt-2">Headers</h4>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`Content-Type: application/json`}
          </pre>

          <h4 className="font-semibold mt-2">Request Body</h4>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`{
  "status": "success",
  "payment_id": "ABC123XYZ",
  "transactionId": "TXN123456",
  "admin_name": "admin123"
}`}
          </pre>

          <h4 className="font-semibold mt-2">Field Descriptions</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Parameter</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Required</th>
                  <th className="border p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">status</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">New status ("success", "failed", "rejected")</td>
                </tr>
                <tr>
                  <td className="border p-2">payment_id</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Unique payment ID from the original payout request</td>
                </tr>
                <tr>
                  <td className="border p-2">transactionId</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Transaction ID from payment provider</td>
                </tr>
                <tr>
                  <td className="border p-2">admin_name</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">ID/name of admin/agent performing the update</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold mt-4">Response</h3>
          <h4 className="font-semibold mt-2">Success Response (200)</h4>
          <pre className="bg-green-900 text-green-100 p-4 rounded overflow-x-auto text-xs">
{`{
  "success": true,
  "message": "Status updated successfully!"
}`}
          </pre>

          <h4 className="font-semibold mt-2">Status Flow</h4>
          <ul className="list-disc ml-5">
            <li><strong>success</strong> - Payout successfully processed</li>
            <li><strong>failed</strong> - Payout failed during processing</li>
            <li><strong>rejected</strong> - Payout was rejected by admin</li>
          </ul>

          <h4 className="font-semibold mt-4">Example Frontend Implementation</h4>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`const handleSaveUpdate = () => {
  // Validate required fields
  if (!status) {
    showErrorAlert('Status is required!');
    return;
  }

  if (selectedRow) {
    axios.post(\`\${process.env.REACT_APP_BASE_URL}/payment/changePayoutStatus\`, {
      status: newStatus,
      payment_id: selectedRow.transactionId,
      transactionId: transiction_value,
      admin_name: agent_info._id
    }).then((res) => {
      if(res.data.success) {
        showSuccessAlert(res.data.message);
        
        // Handle post-update actions
        if (newStatus === "success") {
          handleResendCallback(selectedRow.transactionId);
        } else {
          fetchUpdatedData();
        }
      } else {
        showErrorAlert(res.data.message);
      }
    }).catch((err) => {
      console.error(err);
      showErrorAlert('Update failed. Please try again.');
    });
  }
  closeModal();
};`}
          </pre>
        </section> */}

        {/* <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800">🔄 Resend Callback Payout API Documentation</h2>
          <h3 className="font-semibold mt-2">Overview</h3>
          <p>
            This API allows resending payout status callback notifications to merchant callback URLs. It's typically used 
            when a callback fails initially or when the merchant requests a status update.
          </p>

          <h3 className="font-semibold mt-4">Base URL</h3>
          <p><code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">https://api.nagodpay.com/api/payment/resendCallbackPayout</code></p>

          <h3 className="font-semibold mt-4">Authentication</h3>
          <p>Implicit authentication through agent credentials (passed in frontend as authEmail)</p>
          <p>Requires valid payment_id associated with an existing transaction</p>

          <h3 className="font-semibold mt-4">Request</h3>
          <p><strong>HTTP Method:</strong> POST</p>

          <h4 className="font-semibold mt-2">Headers</h4>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`Content-Type: application/json`}
          </pre>

          <h4 className="font-semibold mt-2">Request Body</h4>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`{
  "authEmail": "agent@example.com",
  "payment_id": "ABC123XYZ"
}`}
          </pre>

          <h4 className="font-semibold mt-2">Field Descriptions</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Parameter</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Required</th>
                  <th className="border p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">authEmail</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Email of agent/admin making the request</td>
                </tr>
                <tr>
                  <td className="border p-2">payment_id</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Original payment ID of the transaction</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold mt-4">Response</h3>
          <h4 className="font-semibold mt-2">Success Response (200)</h4>
          <pre className="bg-green-900 text-green-100 p-4 rounded overflow-x-auto text-xs">
{`{
  "success": true
}`}
          </pre>

          <h4 className="font-semibold mt-2">Callback Response</h4>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`{
  "paymentId": "ABC123XYZ",
  "orderId": "ORDER123",
  "amount": 100.00,
  "currency": "BDT",
  "transactionId": "TXN789",
  "status": "success",
  "hash": "security_hash_value"
}`}
          </pre>

          <h4 className="font-semibold mt-2">Callback Field Descriptions</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Parameter</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">paymentId</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Original payment ID from payout system</td>
                </tr>
                <tr>
                  <td className="border p-2">orderId</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Merchant's original order ID</td>
                </tr>
                <tr>
                  <td className="border p-2">amount</td>
                  <td className="border p-2">number</td>
                  <td className="border p-2">Actual sent amount</td>
                </tr>
                <tr>
                  <td className="border p-2">currency</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Currency code</td>
                </tr>
                <tr>
                  <td className="border p-2">transactionId</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Provider transaction ID</td>
                </tr>
                <tr>
                  <td className="border p-2">status</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Current transaction status</td>
                </tr>
                <tr>
                  <td className="border p-2">hash</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Security hash for verification</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold mt-4">Example Frontend Implementation</h4>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`const handleResendCallback = (paymentId) => {
  setLoading(true);
  
  axios.post(\`\${process.env.REACT_APP_BASE_URL}/payment/resendCallbackPayout\`, {
    authEmail: agent_info.email,  // Current agent's email for authentication
    payment_id: paymentId        // Payment ID to resend callback for
  })
  .then((response) => {
    if (response.data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Callback Resent',
        text: 'The status callback was successfully resent to the merchant',
        timer: 2000
      });
    } else if (response.data.message) {
      Swal.fire({
        icon: 'info',
        title: 'Notice',
        text: response.data.message,
        showConfirmButton: true
      });
    }
    refreshTransactionData();  // Refresh the transaction list
  })
  .catch((error) => {
    console.error('Callback resend error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Failed to Resend',
      text: error.response?.data?.error || 'An error occurred',
      showConfirmButton: true
    });
  })
  .finally(() => setLoading(false));
};`}
          </pre>
        </section> */}

        <section className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mt-[30px]">3. Bkash Payment Gateway (P2C)</h2>


  <h3 className="text-xl font-semibold mt-6 mb-2">Endpoint</h3>
  <p><strong>Post:</strong> <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">https://api.nagodpay.com/api/payment/p2c/bkash/payment</code></p>
<div className='mt-4'>
  <h2 className="text-xl font-semibold text-gray-700">Description</h2>
    <p className="mt-2 text-gray-700 leading-relaxed mb-[10px]">
      This documentation describes the API endpoints for integrating with the Bkash payment gateway through your system. 
            The API allows merchants to create payment links, handle callbacks, and check transaction statuses.
  </p>
</div>
        
  <h3 className="text-xl font-semibold mt-6">🛡️ Headers</h3>
  <div className="overflow-x-auto">
    <table className="min-w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-3 text-left">Key</th>
          <th className="border p-3 text-left">Type</th>
          <th className="border p-3 text-left">Required</th>
          <th className="border p-3 text-left">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border p-3">x-api-key</td>
          <td className="border p-3">String</td>
          <td className="border p-3">✅ Yes</td>
          <td className="border p-3">Merchant's unique API key</td>
        </tr>
      </tbody>
    </table>
  </div>
     <h4 className="text-xl font-semibold text-indigo-600 mt-4">Field Descriptions</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Parameter</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Required</th>
                  <th className="border p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">orderId</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Unique order identifier</td>
                </tr>
                <tr>
                  <td className="border p-2">payerId</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">User/player/customer identifier</td>
                </tr>
                <tr>
                  <td className="border p-2">amount</td>
                  <td className="border p-2">number</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Transaction amount</td>
                </tr>
                <tr>
                  <td className="border p-2">currency</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Currency code (BDT/USD)</td>
                </tr>
                <tr>
                  <td className="border p-2">redirectUrl</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">URL to redirect after payment</td>
                </tr>
                <tr>
                  <td className="border p-2">callbackUrl</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">URL for payment status updates</td>
                </tr>
              </tbody>
            </table>
          </div>
       

          <div className="mt-6">

          <h5 className="font-semibold mt-2">Request Body:</h5>
          <pre className="bg-gray-800 p-2 rounded overflow-x-auto text-sm text-white">
{`{
  "orderId": "4Pvi_QxN",
  "payerId": "B044F6",
  "amount": 1000.00,
  "currency": "BDT",
  "redirectUrl": "https://yourwebsite.com/return",
  "callbackUrl": "https://yourwebsite.com/api/callback"
}`}
          </pre>

        

    <h3 className="text-2xl font-semibold text-indigo-700 my-6">✅ Success Response (200)</h3>
          <pre className=" p-2 rounded overflow-x-auto text-sm  bg-green-800 text-white">
{`{
  "success": true,
  "message": "Payment link created.",
  "orderId": "4Pvi_QxN",
  "paymentId": "TR0011UvOQ1hk1748172682998",
  "link": "https://bkash.com/payment/url"
}`}
          </pre>



        </div>

        {/* <div className="mt-6">
          <h4 className="font-semibold text-[25px] mb-[10px]">2. Execute Bkash Payment</h4>
          <p><strong>Endpoint:</strong> POST <code>https://api.nagodpay.com/api/payment/p2c/bkash/callback</code></p>
          <p><strong>Description:</strong> Bkash server-to-server callback for payment status updates.</p>

          <h5 className="font-semibold mt-2">Request Body (from Bkash):</h5>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
{`{
  "paymentID": "TRX123456789",
  "status": "success",
  "transactionStatus": "Completed",
  "amount": "1000.00",
  "currency": "BDT",
  "trxID": "BKASH_TRX_ID",
  "customerMsisdn": "017XXXXXXXX"
}`}
          </pre>

          <h5 className="font-semibold mt-2">Response:</h5>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
{`{
  "success": true,
  "redirectUrl": "https://yourwebsite.com/return"
}`}
          </pre>

          <h5 className="font-semibold mt-2">Callback to Merchant:</h5>
          <p>The system will forward the payment status to your callbackUrl with:</p>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
{`{
  "paymentId": "TRX123456789",
  "orderId": "unique_order_id",
  "amount": 1000.00,
  "currency": "BDT",
  "transactionId": "BKASH_TRX_ID",
  "status": "fully paid",
  "hash": "security_hash"
}`}
          </pre>

          <h5 className="font-semibold mt-2">Status Values:</h5>
          <ul className="list-disc ml-5">
            <li><strong>fully paid</strong>: Successful payment</li>
            <li><strong>processing</strong>: Payment in progress</li>
            <li><strong>hold</strong>: Pending authorization</li>
            <li><strong>expired</strong>: Payment expired</li>
            <li><strong>suspended</strong>: Declined payment</li>
          </ul>
        </div> */}

        <div className="mt-6">
          
          <h4 className="font-semibold text-[22px] mb-3">New Endpoint: Execute Payment Callback</h4>
            <h3 className="text-xl font-semibold mt-6 mb-2">Endpoint</h3>
  <p><strong>Post:</strong> <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">https://api.nagodpay.com/api/payment/p2c/bkash/callback</code></p>
    <h2 className="text-xl font-semibold text-gray-700 mt-4">Description</h2>
          <p className='mt-2'> Bkash server-to-server callback for payment status updates. This endpoint handles payment verification
      and status synchronization between Bkash, Pi2Payz, and your system.</p>

     <h3 className="text-xl font-semibold mt-6">🛡️ Headers</h3>
  <div className="overflow-x-auto">
    <table className="min-w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-3 text-left">Key</th>
          <th className="border p-3 text-left">Type</th>
          <th className="border p-3 text-left">Required</th>
          <th className="border p-3 text-left">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border p-3">x-api-key</td>
          <td className="border p-3">String</td>
          <td className="border p-3">✅ Yes</td>
          <td className="border p-3">Merchant's unique API key</td>
        </tr>
      </tbody>
    </table>
  </div>
     <h4 className="text-xl font-semibold text-indigo-600 mt-4 mb-3">Field Descriptions (you will get all ths data in your redirect url params)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Parameter</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Required</th>
                  <th className="border p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">payment_type</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Type of payment (Deposit/Withdrawal/etc)</td>
                </tr>
                <tr>
                  <td className="border p-2">amount</td>
                  <td className="border p-2">number</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Transaction amount</td>
                </tr>
                <tr>
                  <td className="border p-2">payment_method</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Payment provider (bkash)</td>
                </tr>
                <tr>
                  <td className="border p-2">status</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Payment status (completed/failed/pending)</td>
                </tr>
                <tr>
                  <td className="border p-2">customer_id</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">User/player/customer identifier</td>
                </tr>
                <tr>
                  <td className="border p-2">paymentID</td>
                  <td className="border p-2">string</td>
                  <td className="border p-2">Yes</td>
                  <td className="border p-2">Bkash transaction ID</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h5 className="font-semibold mt-2">Request Body:</h5>
          <pre className="bg-gray-800 p-2 rounded overflow-x-auto text-sm text-white">
{`{
  "payment_type": "Deposit",
  "amount": 1000.00,
  "payment_method": "bkash",
  "status": "completed",
  "customer_id": "user_12345",
  "paymentID": "TRX123456789"
}`}
          </pre>

   

          <h5 className="font-semibold mt-2">Response (Success):</h5>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
{`{
  "success": true,
  "message": "Callback processed successfully",
  "transaction": {
    "paymentId": "TRX123456789",
    "status": "fully paid",
    "verified": true
  }
}`}
          </pre>

          <h5 className="font-semibold mt-2">Response (Error):</h5>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
{`{
  "success": false,
  "message": "Transaction not found",
  "errorCode": "TRX_NOT_FOUND"
}`}
          </pre>
        </div>
<div className="mt-6">
  <h4 className="font-semibold text-[22px] mb-3">Function</h4>
  <h3 className="text-xl font-semibold mt-6 mb-2">Description</h3>
  <p className='mt-2'>
    This asynchronous function handles the complete flow of a user's money transaction, including:
  </p>
  <ul className="list-disc pl-5 mt-2">
    <li>Fetching transaction status from the payment gateway</li>
    <li>Updating user balance information</li>
    <li>Executing payment callback</li>
    <li>Creating a transaction record in the system</li>
  </ul>

  <h3 className="text-xl font-semibold mt-6 mb-2">Flow Diagram</h3>
  <div className="bg-gray-100 p-4 rounded">
    <pre className="text-sm">
{`1. Fetch transaction status (GET https://api.pi2payz.com/api/user/transaction-status/:transactionId)
   ↓
2. If successful → Fetch user details (GET /auth/user/:userId)
   ↓
3. Execute payment callback (POST /api/payment/p2c/bkash/callback)
   ↓
4. Create transaction record (POST /user/create-transaction)`}
    </pre>
  </div>

  <h3 className="text-xl font-semibold mt-6">Parameters</h3>
  <div className="overflow-x-auto">
    <table className="min-w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-3 text-left">Parameter</th>
          <th className="border p-3 text-left">Type</th>
          <th className="border p-3 text-left">Source</th>
          <th className="border p-3 text-left">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border p-3">transactionId</td>
          <td className="border p-3">String</td>
          <td className="border p-3">Component state</td>
          <td className="border p-3">Unique identifier for the transaction</td>
        </tr>
        <tr>
          <td className="border p-3">user_info</td>
          <td className="border p-3">Object</td>
          <td className="border p-3">Component props/state</td>
          <td className="border p-3">Contains user details including _id</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3 className="text-xl font-semibold mt-6">State Updates</h3>
  <div className="overflow-x-auto">
    <table className="min-w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-3 text-left">State Variable</th>
          <th className="border p-3 text-left">Update Condition</th>
          <th className="border p-3 text-left">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border p-3">loading</td>
          <td className="border p-3">Always</td>
          <td className="border p-3">Set to true at start, false at completion</td>
        </tr>
        <tr>
          <td className="border p-3">transaction_info</td>
          <td className="border p-3">Transaction fetch success</td>
          <td className="border p-3">Updated with transaction data</td>
        </tr>
        <tr>
          <td className="border p-3">amount</td>
          <td className="border p-3">Transaction fetch success</td>
          <td className="border p-3">Set to expectedAmount from transaction</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3 className="text-xl font-semibold mt-6">API Endpoints Used</h3>
  <div className="space-y-2">
    <p><strong>GET</strong> <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">https://api.nagodpay.com/api/user/transaction-status/:transactionId</code></p>
    <p><strong>GET</strong> <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">/auth/user/:userId</code> (with Authorization header)</p>
    <p><strong>POST</strong> <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">/user/create-transaction</code></p>
  </div>

  <h3 className="text-xl font-semibold mt-6">Error Handling</h3>
  <p className="mt-2">
    The function uses a try-catch block to handle errors. Any errors during the process are logged to the console but don't break the application flow.
  </p>

  <h3 className="text-xl font-semibold mt-6">Status Mapping</h3>
  <div className="bg-gray-100 p-4 rounded">
    <pre className="text-sm">
{`Transaction API Status → System Status:
"pending" → "failed"
"fully paid" → "success"
(other statuses remain unchanged)`}
    </pre>
  </div>

  <h3 className="text-xl font-semibold mt-6">Example Flow</h3>
  <pre className="bg-gray-800 p-2 rounded overflow-x-auto text-sm text-white">
{`1. Fetch transaction status (TRX12345):
   Response: {
     success: true,
     data: {
       paymentId: "TRX12345",
       expectedAmount: 1000,
       receivedAmount: 1000,
       provider: "bkash",
       status: "fully paid"
     }
   }

2. Fetch user details (user_123):
   Response: {
     success: true,
     user: { balance: 5000 }
   }

3. Execute payment callback:
   Response: { data: { success: true } }

4. Create transaction record:
   Request Body: {
     payment_type: "Deposit",
     post_balance: 5000,
     transaction: "TRX12345",
     amount: 1000,
     payment_method: "bkash",
     status: "success",
     customer_id: "user_123"
   }
   Response: {
     transaction: {
       id: "TXN67890",
       ...otherDetails
     }
   }`}
  </pre>
</div>
   
      </section>
    </div>
 </section>
  );
};

export default Apidocs;