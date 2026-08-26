import React, { useState, useEffect } from 'react';
import { Compass, Mail, Phone, MapPin, Award, CheckCircle2, ChevronDown, BookOpen, ArrowRight, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBlogs } from '../store/slices/watchSlice';

export default function Static({ params, _onPageChange }) {
  const dispatch = useDispatch();
  const blogs = useSelector(state => state.watch.blogs || []);
  const [activeTab, setActiveTab] = useState(params?.view || 'about');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    dispatch(fetchBlogs());
  }, [dispatch]);
  
  // Form state for Contact Us
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    if (params?.view) {
      setActiveTab(params.view);
    }
  }, [params]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setContactSuccess(false), 5000);
  };

  const faqData = [
    { q: "What type of movement does KHRONIQ use?", a: "KHRONIQ watches are equipped with high-quality quartz movements designed to deliver accurate and reliable timekeeping." },
    { q: "Are KHRONIQ watches waterproof?", a: "KHRONIQ watches are water-resistant according to the rating specified for each model. Please refer to your watch's specifications before exposing it to water." },
    { q: "Can I wear my watch while swimming?", a: "Only watches specifically rated for swimming should be worn in water. Always check your model's water-resistance rating before swimming or participating in water activities." },
    { q: "Can I wear my watch while showering?", a: "No. Hot water, soap, shampoo, and steam may damage the seals and reduce water resistance over time." },
    { q: "How long does the battery last?", a: "Depending on the model and usage, the battery typically lasts between 2 to 5 years." },
    { q: "Can I replace the battery myself?", a: "No. Battery replacement should only be carried out by KHRONIQ or an authorized service centre to maintain product integrity and water resistance." },
    { q: "Why has my watch stopped working?", a: "Possible reasons include battery depletion, impact damage, water damage, or internal movement malfunction. If your watch stops unexpectedly, please contact KHRONIQ Customer Support." },
    { q: "Why is my watch gaining or losing a few seconds?", a: "Minor variations in quartz timekeeping are normal and fall within accepted industry standards." },
    { q: "Can I adjust the date at any time?", a: "No. Do not adjust the date between 9:00 PM and 3:00 AM, as this may damage the date-change mechanism." },
    { q: "Can I wear my watch while sleeping?", a: "Although it is possible, removing your watch while sleeping can help reduce unnecessary wear on the strap and case." },
    { q: "How do I clean my watch?", a: "Use a soft microfiber cloth to gently clean the watch. Avoid abrasive cleaners, harsh chemicals, or polishing compounds." },
    { q: "Can leather straps get wet?", a: "Leather straps should be kept away from excessive moisture. If they become wet, dry them naturally and avoid direct heat." },
    { q: "Can I replace the strap?", a: "Yes. Most KHRONIQ watches support compatible replacement straps. We recommend using genuine KHRONIQ straps whenever available." },
    { q: "Does the warranty cover accidental damage?", a: "No. The warranty covers manufacturing defects only and does not cover accidental damage, misuse, normal wear and tear, battery depletion, or unauthorized repairs." },
    { q: "What should I do if my watch arrives damaged?", a: "If your watch arrives damaged or the package appears tampered with, contact KHRONIQ within 24 hours of delivery and provide photographs of the product and packaging." },
    { q: "How can I verify that my watch is genuine?", a: "Purchase only from KHRONIQ or an authorized dealer. Verify the serial number or QR code, where applicable, and retain your original purchase invoice." },
    { q: "Can I return my watch?", a: "Returns are accepted only in accordance with the KHRONIQ Return & Refund Policy. Please review the policy on our Website for eligibility and conditions." },
    { q: "How can I claim my warranty?", a: "Contact KHRONIQ Customer Support with your purchase invoice, warranty card, watch serial number (if applicable), and photographs or videos showing the issue. Our team will guide you through the warranty claim process." },
    { q: "Do I need to register my warranty?", a: "Warranty registration may be available for selected models. Even if registration is optional, we recommend completing it for faster service and product verification." },
    { q: "Can I repair my watch at any local shop?", a: "No. Repairs should only be performed by KHRONIQ or an authorized service centre. Unauthorized repairs may void your warranty." },
    { q: "Are replacement parts genuine?", a: "Yes. KHRONIQ uses genuine replacement parts for approved warranty and service repairs, subject to availability." },
    { q: "Do watch colours look exactly the same as shown online?", a: "We strive to display products accurately. However, slight differences in colour or finish may occur due to screen settings, lighting, and photography." },
    { q: "Do you offer gift wrapping?", a: "Yes, premium gift packaging may be available for eligible products during checkout." },
    { q: "Can I cancel my order?", a: "Orders can generally be cancelled only before dispatch. Once shipped, the order is subject to the applicable Return & Refund Policy." },
    { q: "How long does delivery take?", a: "Estimated delivery timelines are: Metro Cities 2–5 business days, Tier-2 & Tier-3 Cities 3–7 business days, Remote Areas 5–10 business days. Actual delivery times may vary due to logistics or Force Majeure events." },
    { q: "How can I contact KHRONIQ Customer Support?", a: "Email: support@khroniq.com. Our Customer Support team will be happy to assist you with product information, warranty claims, order tracking, returns, servicing, and general enquiries." }
  ];

  const policiesData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Office Address:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
        </div>
      )
    },
    {
      title: "2. Eligibility",
      content: "You must be at least 18 years of age or legally capable of entering into binding contracts under applicable law. By using this Website, you represent that all information provided by you is accurate and complete."
    },
    {
      title: "3. Products",
      content: "KHRONIQ designs, markets, and sells luxury wristwatches and related accessories. Product images are for illustration purposes only. Minor variations in color, texture, finish, leather grain, or packaging may occur due to lighting, manufacturing processes, or display settings and shall not be considered defects."
    },
    {
      title: "4. Pricing & Taxes",
      content: "All prices are displayed in Indian Rupees (INR) unless otherwise specified and are inclusive or exclusive of applicable taxes as indicated at checkout. Applicable GST and shipping charges shall be calculated during checkout. KHRONIQ reserves the right to modify prices without prior notice."
    },
    {
      title: "5. Orders",
      content: (
        <div className="space-y-2">
          <p>All orders are subject to verification and acceptance by the Company. KHRONIQ reserves the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Refuse or cancel any order.</li>
            <li>Limit purchase quantities.</li>
            <li>Cancel orders suspected of fraud or unauthorized transactions.</li>
            <li>Request identity verification before dispatch.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted italic mt-1">Order confirmation does not constitute acceptance until the product has been dispatched.</p>
        </div>
      )
    },
    {
      title: "6. Payments",
      content: "Payments may be made through approved payment gateways, UPI, debit cards, credit cards, net banking, wallets, EMI, or any other payment methods made available on the Website. KHRONIQ does not store your complete payment information."
    },
    {
      title: "7. Shipping & Delivery",
      content: "Estimated delivery timelines are indicative only. Delivery delays caused by courier partners, customs authorities, weather conditions, government restrictions, strikes, pandemics, natural disasters, or other events beyond our reasonable control shall not constitute a breach of these Terms. Risk of loss transfers to the customer upon successful delivery."
    },
    {
      title: "8. Cancellation, Return & Replacement",
      content: "Orders may only be cancelled before dispatch. Returns or replacements shall be governed by our Return & Replacement Policy published separately on this Website. Products damaged due to misuse, negligence, unauthorized repairs, accidental impact, or normal wear and tear shall not qualify for return or replacement."
    },
    {
      title: "9. Warranty",
      content: (
        <div className="space-y-2">
          <p>KHRONIQ watches are covered under a Limited Warranty as specified in the Warranty Policy.</p>
          <p>The warranty covers manufacturing defects only and excludes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Glass damage</li>
            <li>Strap wear</li>
            <li>Battery depletion (unless specified)</li>
            <li>Water damage caused by improper use</li>
            <li>Accidental damage</li>
            <li>Unauthorized servicing</li>
            <li>Cosmetic wear</li>
          </ul>
          <p className="text-[11px] text-luxury-muted mt-1">Warranty claims require the original purchase invoice and warranty card.</p>
        </div>
      )
    },
    {
      title: "10. Account Responsibility",
      content: "Customers are responsible for maintaining the confidentiality of their account credentials. KHRONIQ shall not be liable for unauthorized access resulting from the customer's negligence."
    },
    {
      title: "11. Intellectual Property",
      content: "All content on this Website including but not limited to the KHRONIQ name, logos, wordmarks, product designs, dial designs, photographs, graphics, videos, packaging, QR Codes, model numbers, serial number systems, software, website design, and product descriptions are the exclusive intellectual property of True Knock Industries Private Limited and are protected under applicable intellectual property laws. No content may be copied, reproduced, modified, distributed, published, reverse engineered, or commercially exploited without prior written permission."
    },
    {
      title: "12. Trademarks",
      content: "KHRONIQ®, its logo, taglines, product names, collection names, and associated branding are trademarks or proposed trademarks of True Knock Industries Private Limited. Unauthorized use is strictly prohibited."
    },
    {
      title: "13. Product Authenticity",
      content: "Only products purchased directly from KHRONIQ or its authorized sellers are guaranteed to be genuine. KHRONIQ shall not be responsible for counterfeit or unauthorized products purchased from third parties. Customers are encouraged to verify product authenticity using official serial numbers or QR codes where applicable."
    },
    {
      title: "14. User Conduct",
      content: "Users agree not to violate any law, upload malicious software, attempt unauthorized access, use automated tools to scrape website data, misuse coupons or promotional offers, infringe intellectual property rights, or submit false information. Violation may result in suspension or permanent termination of access."
    },
    {
      title: "15. Limitation of Liability",
      content: "To the maximum extent permitted by law, KHRONIQ shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, goodwill, business opportunities, or data arising from the use of this Website or our products. Our total liability shall not exceed the amount actually paid for the product giving rise to the claim."
    },
    {
      title: "16. Disclaimer",
      content: "This Website and all products are provided on an \"as available\" and \"as is\" basis. While reasonable efforts are made to ensure accuracy, KHRONIQ does not warrant that the Website will always remain uninterrupted, information will always be error-free, or that every product image exactly represents the delivered product."
    },
    {
      title: "17. Force Majeure",
      content: "KHRONIQ shall not be liable for delay or failure in performance resulting from events beyond reasonable control including but not limited to pandemics, epidemics, floods, earthquakes, fires, natural disasters, wars, terrorism, riots, strikes, lockouts, curfews, government restrictions, import/export regulations, customs delays, transport disruptions, road closures, traffic restrictions, power failures, internet outages, cyber incidents, or any similar event."
    },
    {
      title: "18. Privacy",
      content: "Collection and processing of personal information shall be governed by the KHRONIQ Privacy Policy available on this Website."
    },
    {
      title: "19. Third-Party Links",
      content: "The Website may contain links to third-party websites for convenience. KHRONIQ does not endorse or control such websites and shall not be responsible for their content, policies, or services."
    },
    {
      title: "20. Modifications",
      content: "KHRONIQ reserves the right to modify these Terms & Conditions, product information, pricing, services, or Website content at any time without prior notice. Continued use of the Website after such modifications constitutes acceptance of the revised Terms."
    },
    {
      title: "21. Governing Law & Jurisdiction",
      content: "These Terms shall be governed by and interpreted in accordance with the laws of India. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts located in Lucknow, Uttar Pradesh, unless otherwise required by applicable law."
    },
    {
      title: "22. Severability",
      content: "If any provision of these Terms is declared invalid or unenforceable, the remaining provisions shall continue in full force and effect."
    },
    {
      title: "23. Entire Agreement",
      content: "These Terms & Conditions, together with the Privacy Policy, Shipping Policy, Return & Replacement Policy, Warranty Policy, and any other policies published by KHRONIQ, constitute the complete agreement between the customer and the Company regarding use of this Website."
    },
    {
      title: "24. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p className="text-[11px] text-luxury-muted italic">Born From The Movement Of Time</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-1">
            <p><span className="font-semibold text-luxury-text">Office Address:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];

  const warrantyData = [
    {
      title: "1. Warranty Coverage",
      content: "Every genuine KHRONIQ watch purchased from KHRONIQ or an Authorized Dealer is covered by a Limited Warranty of Twelve (12) Months from the original date of purchase, unless otherwise specified. This warranty applies only to manufacturing defects in materials and workmanship under normal use."
    },
    {
      title: "2. What is Covered",
      content: (
        <div className="space-y-2">
          <p>The Limited Warranty covers the following components if they fail due to manufacturing defects under normal use:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Manufacturing defects in the watch movement.</li>
            <li>Defects in the dial resulting from manufacturing.</li>
            <li>Manufacturing defects in the watch hands.</li>
            <li>Defective date display mechanism.</li>
            <li>Crown malfunction due to manufacturing defect.</li>
            <li>Defective push buttons (where applicable).</li>
            <li>Manufacturing defects in the watch case.</li>
            <li>Manufacturing defects in the bracelet clasp or buckle.</li>
            <li>Defective deployment clasp due to manufacturing.</li>
            <li>Manufacturing defects affecting normal timekeeping.</li>
            <li>Loose indices or hour markers caused by manufacturing.</li>
            <li>Factory-installed components that fail due to manufacturing defects.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">KHRONIQ reserves the right to repair, replace, or service the defective component at its sole discretion.</p>
        </div>
      )
    },
    {
      title: "3. What is Not Covered",
      content: (
        <div className="space-y-2">
          <p>This warranty does not cover:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Normal wear and tear.</li>
            <li>Scratches on crystal, case, bracelet, clasp, or buckle.</li>
            <li>Leather strap wear, fading, stretching, cracking, or discoloration.</li>
            <li>Mesh, silicone, rubber, nylon, fabric, or metal strap wear caused by normal use.</li>
            <li>Battery depletion (unless otherwise specified).</li>
            <li>Damage caused by dropping, impact, accidents, or mishandling.</li>
            <li>Water damage due to improper use beyond the stated water-resistance rating.</li>
            <li>Damage caused by chemicals, perfumes, detergents, solvents, cosmetics, or saltwater unless specifically designed for such use.</li>
            <li>Damage caused by excessive heat, fire, smoke, or extreme temperatures.</li>
            <li>Damage resulting from floods, earthquakes, storms, or other natural disasters.</li>
            <li>Damage caused by negligence, misuse, abuse, or improper storage.</li>
            <li>Unauthorized modifications or repairs.</li>
            <li>Removal or alteration of the serial number or QR code.</li>
            <li>Cosmetic changes that do not affect functionality.</li>
            <li>Damage caused during transportation after delivery.</li>
            <li>Loss or theft of the watch or accessories.</li>
          </ul>
        </div>
      )
    },
    {
      title: "4. Warranty Conditions",
      content: (
        <div className="space-y-2">
          <p>To obtain warranty service, the following conditions must be met:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The original purchase invoice must be presented.</li>
            <li>The original KHRONIQ Warranty Card must accompany the watch.</li>
            <li>The serial number must be clearly readable and unaltered.</li>
            <li>The watch must not have been opened or repaired by any unauthorized person.</li>
            <li>Warranty applies only to the original purchaser unless otherwise permitted by law.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted italic">Failure to satisfy these conditions may result in rejection of the warranty claim.</p>
        </div>
      )
    },
    {
      title: "5. Warranty Claim Procedure",
      content: (
        <div className="space-y-2">
          <p>To request warranty service:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Contact KHRONIQ Customer Support.</li>
            <li>Provide your Order Number or Invoice.</li>
            <li>Share the Model Number and Serial Number.</li>
            <li>Describe the issue along with clear photographs or videos, if requested.</li>
            <li>Follow the shipping instructions provided by our support team.</li>
          </ol>
          <p className="text-[11px] text-luxury-muted">KHRONIQ may inspect the product before approving the warranty claim.</p>
        </div>
      )
    },
    {
      title: "6. Repair or Replacement",
      content: "If a valid manufacturing defect is confirmed, KHRONIQ may, at its sole discretion: repair the defective watch, replace defective components, replace the watch with the same model, or replace the watch with an equivalent model if the original model has been discontinued. Repaired or replaced parts shall become the property of KHRONIQ."
    },
    {
      title: "7. Warranty Period After Repair",
      content: "Repair or replacement under warranty shall not extend or renew the original warranty period. The warranty continues only for the remaining portion of the original warranty."
    },
    {
      title: "8. Shipping for Warranty",
      content: "Where applicable, customers may be responsible for securely packaging and shipping the watch to the designated service center. KHRONIQ is not responsible for damage caused by inadequate packaging during transit. Return shipping arrangements shall be communicated after warranty approval."
    },
    {
      title: "9. Water Resistance",
      content: "Water resistance is not permanent and may diminish over time due to normal wear, aging of seals, accidental impacts, or improper handling. The warranty does not cover water damage resulting from operation of the crown or pushers while underwater, failure to properly secure the crown, use beyond the specified water-resistance rating, or damage caused after unauthorized servicing. Customers should regularly inspect water-resistant watches if frequently exposed to water."
    },
    {
      title: "10. Leather Strap Notice",
      content: "Leather is a natural material and may develop variations in texture, grain, or color over time. Such natural characteristics are not manufacturing defects and are not covered under warranty."
    },
    {
      title: "11. Battery",
      content: "Quartz watch batteries are consumable items. Battery replacement due to normal depletion is not covered unless otherwise stated in the product description."
    },
    {
      title: "12. Exclusions from Liability",
      content: "KHRONIQ shall not be liable for loss of business, loss of profits, emotional distress, indirect or consequential damages, delays caused by courier partners, or delays due to Force Majeure events."
    },
    {
      title: "13. Counterfeit Products",
      content: "This warranty applies only to genuine KHRONIQ products purchased directly from KHRONIQ or an Authorized Dealer. Counterfeit, altered, or unauthorized products are not eligible for warranty service."
    },
    {
      title: "14. Authenticity Verification",
      content: "KHRONIQ may require verification of the Serial Number, QR Code, Purchase Invoice, and Warranty Card before processing any warranty request."
    },
    {
      title: "15. Right to Refuse Warranty",
      content: "KHRONIQ reserves the right to refuse warranty service if the watch is counterfeit, the serial number has been removed or tampered with, the watch has been modified, the defect resulted from misuse or negligence, or if false or misleading information has been provided."
    },
    {
      title: "16. Force Majeure",
      content: "KHRONIQ shall not be responsible for delays in warranty service caused by events beyond its reasonable control, including pandemics, epidemics, natural disasters, floods, earthquakes, fires, wars, strikes, government restrictions, transport disruptions, customs delays, or other Force Majeure events."
    },
    {
      title: "17. Governing Law",
      content: "This Warranty Policy shall be governed by the laws of India. Any dispute arising from this Warranty Policy shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law."
    },
    {
      title: "18. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
            <p><span className="font-semibold text-luxury-text">Office Address:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI APARTMENT, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];

  const codData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      )
    },
    {
      title: "2. Cash on Delivery (COD)",
      content: "KHRONIQ currently does not offer Cash on Delivery (COD) as a payment option. All orders placed through our Website must be paid in full at the time of purchase using one of our supported online payment methods."
    },
    {
      title: "3. Accepted Payment Methods",
      content: (
        <div className="space-y-2">
          <p>Customers may complete their purchase using secure online payment options, including but not limited to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>UPI</li>
            <li>Credit Cards</li>
            <li>Debit Cards</li>
            <li>Net Banking</li>
            <li>Digital Wallets (where available)</li>
            <li>Other payment methods displayed during checkout</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">All payments are processed through secure payment gateways.</p>
        </div>
      )
    },
    {
      title: "4. Why COD Is Not Available",
      content: (
        <div className="space-y-2">
          <p>To ensure a secure and efficient shopping experience, KHRONIQ operates on a 100% prepaid order model. This helps us:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verify genuine customer orders.</li>
            <li>Reduce fraudulent transactions.</li>
            <li>Ensure faster order processing and dispatch.</li>
            <li>Maintain inventory accuracy.</li>
            <li>Provide a seamless customer experience.</li>
          </ul>
        </div>
      )
    },
    {
      title: "5. Order Confirmation",
      content: "An order will be confirmed only after successful payment authorization. Customers will receive an order confirmation via email and/or SMS once payment has been successfully received."
    },
    {
      title: "6. Payment Security",
      content: "KHRONIQ does not store customers' payment card details. Payments are processed using trusted third-party payment service providers that employ industry-standard encryption and security measures."
    },
    {
      title: "7. Payment Failure",
      content: (
        <div className="space-y-2">
          <p>If a payment fails or remains incomplete:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The order will not be confirmed.</li>
            <li>Products will not be reserved indefinitely.</li>
            <li>Customers may place a new order after successful payment.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">KHRONIQ is not responsible for payment failures caused by banks, payment gateways, internet connectivity issues, or other third-party service interruptions.</p>
        </div>
      )
    },
    {
      title: "8. Refunds",
      content: "Where a refund is approved under the applicable Return & Refund Policy or Cancellation Policy, the amount will be refunded to the original payment method used during the purchase. Refund processing timelines are subject to the relevant policy and the processing time of banks or payment service providers."
    },
    {
      title: "9. Future Availability of COD",
      content: "KHRONIQ may introduce Cash on Delivery (COD) for selected products, locations, or customers in the future. If COD becomes available, the applicable terms and conditions will be published on our Website and may vary based on order value, delivery location, customer history, or operational requirements."
    },
    {
      title: "10. Policy Modifications",
      content: "KHRONIQ reserves the right to amend, modify, suspend, or discontinue this COD Policy at any time without prior notice. The latest version will always be available on our Website. Continued use of the Website constitutes acceptance of the updated Policy."
    },
    {
      title: "11. Governing Law & Jurisdiction",
      content: "This COD Policy shall be governed by and interpreted in accordance with the laws of India. Any dispute arising out of or relating to this Policy shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law."
    },
    {
      title: "12. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
            <p><span className="font-semibold text-luxury-text">Registered Office:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];

  const privacyData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      )
    },
    {
      title: "2. Information We Collect",
      content: (
        <div className="space-y-3">
          <p>We may collect the following categories of information:</p>
          
          <div>
            <p className="font-bold text-luxury-text uppercase text-[9px] tracking-wider mb-1">Personal Information</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Full Name</li>
              <li>Email Address</li>
              <li>Mobile Number</li>
              <li>Shipping Address</li>
              <li>Billing Address</li>
              <li>Company Name (if applicable)</li>
              <li>GST Number (for business customers)</li>
              <li>Date of Birth (optional)</li>
              <li>Customer ID</li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-luxury-text uppercase text-[9px] tracking-wider mb-1">Order Information</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Order Number</li>
              <li>Product Purchased</li>
              <li>Serial Number</li>
              <li>Warranty Registration Details</li>
              <li>Payment Status</li>
              <li>Shipping Information</li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-luxury-text uppercase text-[9px] tracking-wider mb-1">Technical Information</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>IP Address</li>
              <li>Browser Type</li>
              <li>Device Information</li>
              <li>Operating System</li>
              <li>Time Zone</li>
              <li>Language Preferences</li>
              <li>Website Usage Data</li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-luxury-text uppercase text-[9px] tracking-wider mb-1">Communication Information</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Customer Support Requests</li>
              <li>Emails</li>
              <li>Chat Messages</li>
              <li>Product Reviews</li>
              <li>Feedback</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "3. How We Use Your Information",
      content: (
        <div className="space-y-2">
          <p>Your information may be used to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process and fulfill orders.</li>
            <li>Deliver products.</li>
            <li>Process payments.</li>
            <li>Provide warranty services.</li>
            <li>Register your watch warranty.</li>
            <li>Verify product authenticity.</li>
            <li>Respond to customer support requests.</li>
            <li>Improve our products and Website.</li>
            <li>Prevent fraud and unauthorized transactions.</li>
            <li>Send order updates.</li>
            <li>Notify you about promotions, launches, and offers (where permitted).</li>
            <li>Comply with legal and regulatory obligations.</li>
          </ul>
        </div>
      )
    },
    {
      title: "4. Payment Information",
      content: "Payments are processed through secure third-party payment gateways. KHRONIQ does not store your complete credit card, debit card, CVV, UPI PIN, or banking credentials on its servers. Payment processing is governed by the privacy policies of the respective payment service providers."
    },
    {
      title: "5. Cookies",
      content: "Our Website may use cookies and similar technologies to remember user preferences, improve browsing experience, analyze Website performance, maintain login sessions, measure Website traffic, and personalize content. You may disable cookies through your browser settings, although certain Website features may not function properly."
    },
    {
      title: "6. Sharing of Information",
      content: (
        <div className="space-y-2">
          <p>We do not sell your personal information. Your information may be shared only with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Courier and logistics partners</li>
            <li>Payment gateways</li>
            <li>Warranty service providers</li>
            <li>Government authorities when legally required</li>
            <li>Technology providers supporting our Website</li>
            <li>Professional advisors including auditors and legal consultants</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">All such parties are expected to maintain appropriate confidentiality.</p>
        </div>
      )
    },
    {
      title: "7. Data Security",
      content: "KHRONIQ implements commercially reasonable administrative, technical, and organizational measures to protect personal information against unauthorized access, disclosure, alteration, or destruction. However, no online system can guarantee absolute security."
    },
    {
      title: "8. Data Retention",
      content: "We retain personal information only for as long as necessary to complete transactions, provide warranty services, comply with legal obligations, resolve disputes, and enforce agreements. Certain financial and tax records may be retained for the period required under applicable laws."
    },
    {
      title: "9. Marketing Communications",
      content: "With your consent or where otherwise permitted by law, we may send promotional emails, SMS, or other communications regarding new collections, exclusive launches, product updates, offers and discounts, and events. You may opt out at any time by using the unsubscribe option or contacting us."
    },
    {
      title: "10. Warranty Registration",
      content: "When registering your KHRONIQ watch, we may collect the Model Number, Serial Number, Purchase Date, Dealer Information, and Invoice Details. This information is used solely for warranty verification, authenticity confirmation, and customer support."
    },
    {
      title: "11. Product Authenticity",
      content: "To protect customers from counterfeit products, KHRONIQ may verify QR Codes, Serial Numbers, Purchase Invoices, and Dealer Information. Information submitted for authenticity verification shall be used only for verification and fraud prevention."
    },
    {
      title: "12. Children's Privacy",
      content: "Our Website is not intended for individuals under the age of 18 years. We do not knowingly collect personal information from children. If we become aware that such information has been collected, we will take reasonable steps to delete it."
    },
    {
      title: "13. Third-Party Links",
      content: "Our Website may contain links to third-party websites. KHRONIQ is not responsible for the privacy practices, content, or policies of such external websites. Users are encouraged to review the privacy policies of those websites separately."
    },
    {
      title: "14. Your Rights",
      content: "Subject to applicable law, you may have the right to access your personal information, request correction of inaccurate information, request deletion where legally permissible, withdraw marketing consent, update your contact details, or request information regarding the processing of your personal data. Requests may be submitted through our customer support email."
    },
    {
      title: "15. Fraud Prevention",
      content: "To protect our customers and business, KHRONIQ may use personal information to detect fraudulent transactions, prevent payment fraud, verify customer identity, investigate suspicious activities, or comply with law enforcement requests where legally required."
    },
    {
      title: "16. International Users",
      content: "If you access our Website from outside India, you acknowledge that your information may be transferred to, processed, and stored in India or other jurisdictions where our service providers operate, subject to applicable legal requirements."
    },
    {
      title: "17. Changes to This Policy",
      content: "KHRONIQ reserves the right to amend or update this Privacy Policy at any time. Any revised version will be published on this Website with the updated Effective Date. Continued use of the Website constitutes acceptance of the revised Privacy Policy."
    },
    {
      title: "18. Governing Law",
      content: "This Privacy Policy shall be governed by the laws of India. Any dispute arising out of or relating to this Privacy Policy shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law."
    },
    {
      title: "19. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
            <p><span className="font-semibold text-luxury-text">Office Address:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];

  const giftingData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      )
    },
    { title: "2. Gift Orders", content: "Customers may purchase any eligible KHRONIQ product as a gift. The recipient does not need to be the purchaser of the product to receive warranty support, provided a valid proof of purchase is available and all warranty conditions are satisfied." },
    {
      title: "3. Gift Packaging",
      content: (
        <div className="space-y-2">
          <p>KHRONIQ may offer premium gift packaging for selected products. Where available, customers may choose optional services such as:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Premium Gift Box</li>
            <li>Gift Wrapping</li>
            <li>Personalized Gift Message</li>
            <li>Greeting Card</li>
            <li>Premium Packaging Accessories</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">Applicable charges, if any, will be displayed during checkout.</p>
        </div>
      )
    },
    {
      title: "4. Gift Message",
      content: (
        <div className="space-y-2">
          <p>Customers may include a personalized gift message during checkout. KHRONIQ reserves the right to refuse or modify messages that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Contain offensive or abusive language.</li>
            <li>Promote illegal activities.</li>
            <li>Infringe intellectual property rights.</li>
            <li>Contain discriminatory or hateful content.</li>
            <li>Violate applicable laws or public policy.</li>
          </ul>
        </div>
      )
    },
    {
      title: "5. Shipping of Gift Orders",
      content: (
        <div className="space-y-2">
          <p>Gift orders are shipped in accordance with the KHRONIQ Shipping Policy. Customers are responsible for providing accurate recipient details, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Recipient Name</li>
            <li>Delivery Address</li>
            <li>PIN Code</li>
            <li>Mobile Number</li>
            <li>Email Address (if applicable)</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">KHRONIQ shall not be responsible for delays or failed deliveries resulting from incorrect or incomplete recipient information.</p>
        </div>
      )
    },
    { title: "6. Pricing & Invoices", content: "Product prices are not displayed on gift packaging. The official tax invoice will be sent electronically to the purchaser's registered email address. KHRONIQ complies with applicable tax laws and may include documentation with shipments where required by law or courier regulations." },
    { title: "7. Warranty on Gift Products", content: "All genuine KHRONIQ watches purchased as gifts are covered under the applicable KHRONIQ Warranty Policy. Warranty eligibility remains subject to valid proof of purchase, product authenticity, compliance with the Warranty Policy, and inspection by KHRONIQ, where applicable." },
    { title: "8. Returns, Refunds & Replacements", content: "Gift purchases are subject to the applicable Return & Refund Policy, Replacement Policy, and Warranty Policy. The fact that a product was purchased as a gift does not create additional rights beyond those provided under the applicable policies. Where a refund is approved, it will be processed only to the original purchaser through the original payment method used for the purchase." },
    { title: "9. Personalized or Customized Gifts", content: "Products that have been engraved, customized, personalized, specially manufactured, or made-to-order cannot be cancelled, returned, or refunded except where required under applicable law or where a verified manufacturing defect exists." },
    { title: "10. Corporate Gifting", content: "KHRONIQ may offer corporate gifting solutions for businesses, institutions, and organizations. Corporate orders may be subject to separate pricing, payment terms, branding options, customization services, minimum order quantities, and contractual conditions. For corporate gifting enquiries, customers may contact support@khroniq.com." },
    { title: "11. Gift Card Availability", content: "If KHRONIQ introduces Gift Cards or Digital Gift Vouchers in the future, separate terms and conditions shall apply and will be published on the Website." },
    {
      title: "12. Limitation of Liability",
      content: (
        <div className="space-y-2">
          <p>KHRONIQ shall not be liable for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Incorrect recipient details provided by the purchaser.</li>
            <li>Delivery delays caused by courier partners or Force Majeure events.</li>
            <li>Gift messages omitted due to technical issues beyond our reasonable control.</li>
            <li>Customer dissatisfaction arising from personal preferences regarding style, colour, or design.</li>
            <li>Consequential, indirect, or incidental losses arising from gift purchases.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">KHRONIQ's maximum liability shall not exceed the purchase price actually paid for the product.</p>
        </div>
      )
    },
    { title: "13. Force Majeure", content: "KHRONIQ shall not be responsible for delays or failures in processing or delivering gift orders due to events beyond its reasonable control, including pandemics, floods, earthquakes, fires, natural disasters, government restrictions, curfews, customs delays, transport disruptions, labour strikes, wars, terrorism, internet outages, cyber incidents, or any other Force Majeure event." },
    { title: "14. Policy Modifications", content: "KHRONIQ reserves the right to amend, modify, or update this Gifting Policy at any time without prior notice. The latest version shall always be available on the Website. Continued use of the Website after such modifications constitutes acceptance of the revised Policy." },
    { title: "15. Governing Law & Jurisdiction", content: "This Gifting Policy shall be governed by and interpreted in accordance with the laws of India. Any dispute arising out of or relating to this Policy shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law." },
    {
      title: "16. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
            <p><span className="font-semibold text-luxury-text">Registered Office:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];
  const replacementData = [
  {
    title: "1. Company Information",
    content: (
      <div className="space-y-2">
        <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
        <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
        <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
        <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
          Office No. - 2, Chamber - 4,<br />
          Udaigiri Tower, Kaushambi,<br />
          Ghaziabad, Uttar Pradesh — 201010,<br />
          India
        </p>
        <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
        <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
      </div>
    )
  },
  {
    title: "2. Replacement Eligibility",
    content: (
      <div className="space-y-2">
        <p>A replacement request may be accepted only under the following circumstances:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The product received has a confirmed manufacturing defect.</li>
          <li>The wrong product has been delivered.</li>
          <li>The wrong model, colour, or variant has been shipped by KHRONIQ.</li>
          <li>The product is damaged during transit.</li>
          <li>The package contains missing components or accessories.</li>
          <li>The product becomes non-functional immediately upon delivery due to a manufacturing fault.</li>
        </ul>
        <p className="text-[11px] text-luxury-muted">Replacement requests must be submitted within 7 calendar days from the date of delivery.</p>
      </div>
    )
  },
  {
    title: "3. Products Not Eligible For Replacement",
    content: (
      <div className="space-y-2">
        <p>Replacement requests will not be accepted for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Change of mind after purchase.</li>
          <li>Personal preference regarding design, colour, size, or appearance.</li>
          <li>Damage caused after delivery due to misuse, negligence, accidental impact, or improper handling.</li>
          <li>Normal wear and tear.</li>
          <li>Glass scratches, strap wear, or cosmetic damage resulting from regular use.</li>
          <li>Battery depletion due to normal usage (unless otherwise specified).</li>
          <li>Water damage caused by use beyond the stated water-resistance rating.</li>
          <li>Watches repaired or modified by unauthorized service centres.</li>
          <li>Products with removed, altered, or damaged serial numbers or QR codes.</li>
          <li>Customized, engraved, personalized, or made-to-order products.</li>
          <li>Products purchased from unauthorized sellers or marketplaces not approved by KHRONIQ.</li>
        </ul>
      </div>
    )
  },
  {
    title: "4. Conditions For Replacement",
    content: (
      <div className="space-y-2">
        <p>To qualify for a replacement, the customer must:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Notify KHRONIQ within the eligible replacement period.</li>
          <li>Provide the original purchase invoice or order confirmation.</li>
          <li>Submit clear photographs or videos showing the reported issue.</li>
          <li>Return the product in its original packaging.</li>
          <li>Include the warranty card, manuals, accessories, tags, and protective materials.</li>
          <li>Ensure that the product has not been intentionally damaged or tampered with.</li>
        </ul>
        <p className="text-[11px] text-luxury-muted">KHRONIQ reserves the right to reject any replacement request that does not meet these conditions.</p>
      </div>
    )
  },
  {
    title: "5. Replacement Request Process",
    content: (
      <div className="space-y-2">
        <p>To request a replacement:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Contact KHRONIQ Customer Support.</li>
          <li>Provide your Order Number or Invoice Number.</li>
          <li>Share photographs or videos of the product and packaging.</li>
          <li>Wait for written approval from KHRONIQ.</li>
          <li>Return the product only after receiving replacement authorization.</li>
          <li>Pack the product securely to prevent transit damage.</li>
        </ol>
        <p className="text-[11px] text-luxury-muted">Replacement requests submitted without prior approval may not be processed.</p>
      </div>
    )
  },
  {
    title: "6. Product Inspection",
    content: (
      <div className="space-y-2">
        <p>Every returned product will undergo inspection by KHRONIQ.</p>
        <p>If the inspection confirms that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The issue is covered under this Policy; and</li>
          <li>The product has not been misused, altered, or damaged by the customer,</li>
        </ul>
        <p>a replacement may be approved.</p>
        <p className="text-[11px] text-luxury-muted">If no manufacturing defect or eligible issue is found, KHRONIQ reserves the right to decline the replacement request and return the product to the customer.</p>
      </div>
    )
  },
  {
    title: "7. Availability Of Replacement",
    content: (
      <div className="space-y-2">
        <p>Replacement is subject to stock availability.</p>
        <p>If the identical model is unavailable, KHRONIQ may, at its sole discretion:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Replace the product with the same model once available;</li>
          <li>Offer an equivalent model of equal or higher value; or</li>
          <li>Offer another suitable resolution in accordance with applicable law.</li>
        </ul>
      </div>
    )
  },
  {
    title: "8. Shipping For Replacement",
    content: "Where a replacement is approved due to an error by KHRONIQ, such as a manufacturing defect, transit damage, or incorrect shipment, KHRONIQ may arrange pickup or bear the reasonable shipping cost. If the product is found not to qualify for replacement, the customer may be responsible for applicable shipping charges."
  },
  {
    title: "9. Replacement Of Replacement Products",
    content: "A replacement product continues to be covered only for the remaining period of the original warranty, unless otherwise required by applicable law. Replacement does not restart or extend the original warranty period."
  },
  {
    title: "10. Fraud Prevention",
    content: (
      <div className="space-y-2">
        <p>KHRONIQ reserves the right to reject any replacement request involving:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>False claims.</li>
          <li>Fraudulent transactions.</li>
          <li>Misrepresentation.</li>
          <li>Repeated abuse of the replacement process.</li>
          <li>Intentional product damage.</li>
          <li>Submission of counterfeit or unauthorized products.</li>
        </ul>
        <p className="text-[11px] text-luxury-muted">Appropriate legal action may be taken where necessary.</p>
      </div>
    )
  },
  {
    title: "11. Limitation Of Liability",
    content: (
      <div className="space-y-2">
        <p>KHRONIQ shall not be liable for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Delays caused by courier partners.</li>
          <li>Delays due to Force Majeure events.</li>
          <li>Loss or damage arising from unauthorized repairs.</li>
          <li>Indirect, incidental, or consequential damages.</li>
        </ul>
        <p className="text-[11px] text-luxury-muted">Our total liability shall not exceed the purchase price actually paid for the product concerned.</p>
      </div>
    )
  },
  {
    title: "12. Force Majeure",
    content: "KHRONIQ shall not be responsible for delays in processing replacement requests caused by circumstances beyond its reasonable control, including pandemics, floods, earthquakes, fires, government restrictions, transport disruptions, customs delays, strikes, wars, cyber incidents, or other Force Majeure events."
  },
  {
    title: "13. Policy Modifications",
    content: "KHRONIQ reserves the right to amend, modify, or update this Replacement Policy at any time without prior notice. The latest version shall always be available on https://www.khroniq.com/. Continued use of the Website after such modifications constitutes acceptance of the revised Policy."
  },
  {
    title: "14. Governing Law & Jurisdiction",
    content: "This Replacement Policy shall be governed by and interpreted in accordance with the laws of India. Any dispute arising out of or relating to this Policy shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law."
  },
  {
    title: "15. Contact Us",
    content: (
      <div className="space-y-2">
        <p className="font-bold text-luxury-text">KHRONIQ</p>
        <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
        <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
          <p><span className="font-semibold text-luxury-text">Registered Office:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
          <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      </div>
    )
  }
];
    const shippingData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      )
    },
    { title: "2. Shipping Coverage", content: "KHRONIQ currently delivers products across India. International shipping may be introduced in the future. If available, eligible countries, shipping charges, customs information, and delivery timelines will be displayed during checkout." },
    {
      title: "3. Order Processing",
      content: (
        <div className="space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Orders are processed only after successful payment verification.</li>
            <li>Standard processing time is 1–3 Business Days.</li>
            <li>During festivals, product launches, promotional campaigns, public holidays, or high-volume periods, processing may take additional time.</li>
            <li>Orders placed on Sundays or Government Holidays will be processed on the next Business Day.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted italic">Processing time is separate from shipping and delivery time.</p>
        </div>
      )
    },
    {
      title: "4. Shipping Partners",
      content: (
        <div className="space-y-2">
          <p>To ensure secure and timely deliveries, KHRONIQ may ship orders through reputed logistics partners, including but not limited to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Blue Dart</li>
            <li>Delhivery</li>
            <li>DTDC</li>
            <li>Xpressbees</li>
            <li>Ecom Express</li>
            <li>India Post</li>
            <li>Other authorized courier partners</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">KHRONIQ reserves the right to choose the most appropriate shipping partner for each order.</p>
        </div>
      )
    },
    {
      title: "5. Shipping Charges",
      content: (
        <div className="space-y-2">
          <p>Shipping charges, if applicable, will be displayed during checkout before payment. KHRONIQ may, at its sole discretion, offer:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Free Shipping</li>
            <li>Express Shipping</li>
            <li>Promotional Shipping Offers</li>
            <li>Limited-Time Shipping Discounts</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">Such offers may be modified or withdrawn without prior notice.</p>
        </div>
      )
    },
    {
      title: "6. Delivery Estimates",
      content: (
        <div className="space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Metro Cities: 2–5 Business Days</li>
            <li>Tier-2 & Tier-3 Cities: 3–7 Business Days</li>
            <li>Remote & Rural Areas: 5–10 Business Days</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">These are estimated timelines only and are not guaranteed delivery commitments.</p>
        </div>
      )
    },
    {
      title: "7. Order Tracking",
      content: (
        <div className="space-y-2">
          <p>Once your order is dispatched, you will receive:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Order Dispatch Confirmation</li>
            <li>Courier Name</li>
            <li>Tracking Number</li>
            <li>Tracking Link (where available)</li>
          </ul>
        </div>
      )
    },
    {
      title: "8. Delivery Address",
      content: (
        <div className="space-y-2">
          <p>Customers are responsible for providing:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Correct Full Name</li>
            <li>Complete Delivery Address</li>
            <li>Landmark (if applicable)</li>
            <li>PIN Code</li>
            <li>Mobile Number</li>
            <li>Email Address</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">KHRONIQ shall not be liable for delays, failed deliveries, or additional shipping costs arising from incorrect or incomplete address information provided by the customer.</p>
        </div>
      )
    },
    { title: "9. Delivery Attempts", content: "Courier partners generally make multiple delivery attempts. If delivery cannot be completed because the customer is unavailable, the address is incorrect, delivery is refused, or the customer cannot be contacted, the shipment may be returned to KHRONIQ. Any re-shipping charges may be payable by the customer." },
    { title: "10. Package Inspection", content: "Customers are advised to inspect the package before accepting delivery. If the package appears damaged, opened, tampered, wet, torn, or broken, please refuse delivery (where possible) and immediately notify KHRONIQ Customer Support with photographs. Acceptance of a visibly damaged package may affect the resolution process." },
    { title: "11. Risk of Loss", content: "Ownership and risk of loss shall pass to the customer upon successful delivery of the shipment to the delivery address provided during checkout." },
    { title: "12. Shipping Delays", content: "Delivery timelines may be affected by circumstances beyond KHRONIQ's reasonable control, including weather conditions, floods, earthquakes, cyclones, fire, natural disasters, pandemics, government restrictions, curfew, public holidays, customs clearance delays, road closures, traffic restrictions, transport disruptions, political unrest, strikes, lockouts, war, terrorism, or other Force Majeure events. KHRONIQ shall not be liable for delays arising from such circumstances." },
    { title: "13. Partial Shipments", content: "Where necessary, KHRONIQ may dispatch an order in multiple shipments. Customers shall not incur additional shipping charges solely because an order is shipped in separate consignments by KHRONIQ." },
    { title: "14. Failed Delivery", content: "Orders returned due to incorrect address, customer unavailable, delivery refusal, non-collection, or incomplete address may be cancelled or re-shipped after payment of applicable re-shipping charges." },
    { title: "15. Pre-Order Products", content: "Products sold as Pre-Order or Coming Soon items shall be dispatched according to the estimated shipping date displayed on the respective product page. Estimated dispatch dates may change due to manufacturing schedules, quality control, customs clearance, or logistics requirements." },
    { title: "16. Lost or Missing Shipments", content: "If your shipment appears lost or remains undelivered beyond the estimated timeline, please contact KHRONIQ Customer Support within 7 days of the expected delivery date. KHRONIQ will coordinate with the courier partner to investigate the shipment before approving any replacement or refund, where applicable." },
    { title: "17. International Orders", content: "If international shipping is available, import duties, customs charges, local taxes, VAT/GST, clearance fees, and brokerage charges shall be the sole responsibility of the customer unless expressly stated otherwise at checkout. KHRONIQ is not responsible for delays caused by customs authorities in the destination country." },
    { title: "18. Force Majeure", content: "KHRONIQ shall not be responsible for delays or failures in shipping caused by events beyond its reasonable control, including but not limited to pandemics, floods, earthquakes, fires, storms, wars, civil disturbances, strikes, transport failures, traffic restrictions, customs delays, government actions, internet outages, cyber incidents, or any other Force Majeure event." },
    { title: "19. Policy Modifications", content: "KHRONIQ reserves the right to modify, amend, or update this Shipping Policy at any time without prior notice. The latest version will always be available on the Website. Continued use of the Website after such modifications constitutes acceptance of the revised Shipping Policy." },
    { title: "20. Governing Law & Jurisdiction", content: "This Shipping Policy shall be governed by the laws of India. Any dispute arising out of or relating to this Shipping Policy shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law." },
    {
      title: "21. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
            <p><span className="font-semibold text-luxury-text">Registered Office:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];
    const refundData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      )
    },
    {
      title: "2. Return Eligibility",
      content: (
        <div className="space-y-2">
          <p>A return request may be accepted only if:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The product delivered is incorrect.</li>
            <li>The product is received in a damaged condition.</li>
            <li>The product has a verified manufacturing defect.</li>
            <li>The customer receives an incomplete order or missing item.</li>
            <li>The wrong model, colour, or variant has been shipped by KHRONIQ.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">All return requests must be submitted within 7 calendar days from the date of delivery.</p>
        </div>
      )
    },
    {
      title: "3. Non-Returnable Products",
      content: (
        <div className="space-y-2">
          <p>Returns shall not be accepted for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Change of mind after purchase.</li>
            <li>Incorrect product selection by the customer.</li>
            <li>Personal preference regarding colour, design, size, or appearance.</li>
            <li>Normal wear and tear after use.</li>
            <li>Scratches, dents, or accidental damage after delivery.</li>
            <li>Damage caused by misuse, negligence, improper handling, or unauthorized repairs.</li>
            <li>Products with removed, altered, or damaged serial numbers or QR codes.</li>
            <li>Customized, engraved, or personalized watches.</li>
            <li>Products purchased from unauthorized sellers.</li>
            <li>Gift cards, promotional items, or complimentary accessories.</li>
          </ul>
        </div>
      )
    },
    {
      title: "4. Return Conditions",
      content: (
        <div className="space-y-2">
          <p>To qualify for a return, the product must:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Be unused and unworn.</li>
            <li>Be returned in its original condition.</li>
            <li>Include the original watch box, warranty card, manuals, accessories, tags, and protective packaging.</li>
            <li>Be accompanied by the original purchase invoice or order confirmation.</li>
            <li>Be securely packed to avoid damage during return transit.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">KHRONIQ reserves the right to reject returns that do not satisfy these conditions.</p>
        </div>
      )
    },
    {
      title: "5. How to Request a Return",
      content: (
        <div className="space-y-2">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Contact KHRONIQ Customer Support within the eligible return period.</li>
            <li>Provide your Order Number or Invoice.</li>
            <li>Share clear photographs or videos of the product and packaging.</li>
            <li>Wait for written return authorization from KHRONIQ.</li>
            <li>Follow the return instructions provided by our support team.</li>
          </ol>
          <p className="text-[11px] text-luxury-muted">Returns sent without prior approval may not be accepted.</p>
        </div>
      )
    },
    { title: "6. Product Inspection", content: "Every returned product shall undergo a quality inspection. If the returned product is found to have been used, be damaged by the customer, be incomplete, be tampered with, contain missing accessories, or not match the reported issue, KHRONIQ reserves the right to reject the return request." },
    {
      title: "7. Refund Policy",
      content: (
        <div className="space-y-2">
          <p>Refunds may be approved only in the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The order is cancelled before dispatch.</li>
            <li>A return is approved after inspection.</li>
            <li>The product has a confirmed manufacturing defect and cannot be repaired or replaced.</li>
            <li>The ordered product is unavailable or cannot be fulfilled by KHRONIQ.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">Refunds shall not be issued merely because the customer changes their mind after receiving the product.</p>
        </div>
      )
    },
    { title: "8. Refund Process", content: "Approved refunds shall be processed to the original payment method used at the time of purchase. Refunds are generally initiated within 7–10 Business Days after approval. Actual credit timelines may vary depending on the customer's bank, card issuer, or payment gateway. Shipping charges, gift wrapping charges, Cash on Delivery fees (if applicable), and other service charges are non-refundable unless the return is due to an error on the part of KHRONIQ." },
    { title: "9. Damaged or Tampered Shipments", content: "If your package appears opened, tampered, damaged, torn, or wet, please refuse delivery wherever possible and immediately notify KHRONIQ within 24 hours with supporting photographs. Failure to report such issues promptly may affect eligibility for return or refund." },
    { title: "10. Return Shipping", content: "If the return is approved due to manufacturing defect, wrong product, incorrect variant, or shipping damage, KHRONIQ may arrange return pickup or reimburse reasonable return shipping charges at its discretion. If the return is accepted for any other permissible reason, the customer may be responsible for return shipping costs." },
    { title: "11. Fraud Prevention", content: "KHRONIQ reserves the right to refuse returns or refunds where fraudulent activity, abuse of this Policy, false claims, excessive return patterns, or suspicious transactions are detected." },
    { title: "12. Limitation of Liability", content: "KHRONIQ shall not be liable for delays caused by courier partners, delays in banking or payment gateway processing, loss or damage during unauthorized return shipments, or claims arising from misuse, negligence, accidental damage, or unauthorized repairs. Our maximum liability shall not exceed the purchase price actually paid for the concerned product." },
    { title: "13. Force Majeure", content: "KHRONIQ shall not be responsible for delays in processing returns or refunds caused by events beyond its reasonable control, including pandemics, floods, earthquakes, fires, government restrictions, transport disruptions, customs delays, strikes, wars, cyber incidents, or other Force Majeure events." },
    { title: "14. Policy Modifications", content: "KHRONIQ reserves the right to amend or update this Return & Refund Policy at any time without prior notice. The latest version shall always be available on the Website. Continued use of the Website after such modifications constitutes acceptance of the revised Policy." },
    { title: "15. Governing Law & Jurisdiction", content: "This Policy shall be governed by and interpreted in accordance with the laws of India. Any dispute arising out of or relating to this Policy shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law." },
    {
      title: "16. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
            <p><span className="font-semibold text-luxury-text">Registered Office:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];

  const repairServiceData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      )
    },
    {
      title: "2. Services Covered",
      content: (
        <div className="space-y-2">
          <p>KHRONIQ may provide the following services:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Warranty Inspection</li>
            <li>Mechanical & Functional Inspection</li>
            <li>Quartz Movement Repair</li>
            <li>Battery Replacement</li>
            <li>Crown Repair or Replacement</li>
            <li>Strap Replacement</li>
            <li>Buckle Replacement</li>
            <li>Crystal (Glass) Replacement</li>
            <li>Dial Inspection</li>
            <li>Hand Alignment</li>
            <li>Water Resistance Inspection</li>
            <li>Case & Bracelet Cleaning</li>
            <li>Polishing (Selected Models)</li>
            <li>Full Watch Servicing</li>
            <li>Genuine Spare Parts Replacement</li>
            <li>Quality Testing before Return</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">Service availability may vary depending on the model and spare parts availability.</p>
        </div>
      )
    },
    {
      title: "3. Warranty Repairs",
      content: (
        <div className="space-y-2">
          <p>If the issue is covered under the official KHRONIQ Warranty Policy, repairs or replacement of defective parts may be carried out without labour charges, subject to inspection and approval. The warranty does not cover:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Accidental damage</li>
            <li>Impact damage</li>
            <li>Glass breakage</li>
            <li>Water damage caused by misuse</li>
            <li>Battery depletion due to normal usage</li>
            <li>Cosmetic scratches</li>
            <li>Strap wear and tear</li>
            <li>Unauthorized repairs or modifications</li>
            <li>Damage caused by negligence or improper handling</li>
          </ul>
        </div>
      )
    },
    {
      title: "4. Paid Repairs",
      content: (
        <div className="space-y-2">
          <p>Repairs outside warranty may be offered on a chargeable basis. Charges may include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Inspection Fee (where applicable)</li>
            <li>Labour Charges</li>
            <li>Spare Parts Cost</li>
            <li>Battery Cost</li>
            <li>Crystal Replacement</li>
            <li>Strap Replacement</li>
            <li>Return Shipping Charges (if applicable)</li>
            <li>Applicable GST</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">A repair estimate may be shared before commencing paid repairs. Work will begin only after customer approval.</p>
        </div>
      )
    },
    {
      title: "5. Service Request Process",
      content: (
        <div className="space-y-2">
          <p>To request a repair or service:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Contact KHRONIQ Customer Support at support@khroniq.com.</li>
            <li>Provide your Order Number or Invoice Number.</li>
            <li>Share the watch model and serial number (if applicable).</li>
            <li>Describe the issue and attach photographs or videos, if possible.</li>
            <li>Follow the shipping or pickup instructions provided by KHRONIQ.</li>
          </ol>
          <p className="text-[11px] text-luxury-muted">Once received, the watch will undergo inspection. A repair assessment and estimated timeline will be communicated.</p>
        </div>
      )
    },
    {
      title: "6. Service Turnaround Time",
      content: (
        <div className="space-y-2">
          <p>Estimated service timelines:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Battery Replacement: 5–7 Business Days</li>
            <li>Minor Repairs: 7–14 Business Days</li>
            <li>Major Repairs: 15–30 Business Days</li>
            <li>Complex Repairs or Spare Part Procurement: 30–45 Business Days or longer</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">These timelines are estimates and may vary depending on inspection findings, spare part availability, logistics, or Force Majeure events.</p>
        </div>
      )
    },
    { title: "7. Shipping for Service", content: "Customers must securely package the watch before shipment. Unless covered under warranty or specifically agreed by KHRONIQ, the customer is responsible for sending the watch to the designated service location. KHRONIQ may bear the return shipping cost for approved warranty repairs. Customers are advised to use a trackable and insured courier service. KHRONIQ is not responsible for damage caused by inadequate packaging during transit." },
    { title: "8. Genuine Parts", content: "KHRONIQ uses genuine replacement parts whenever available. If an identical component is discontinued or unavailable, KHRONIQ may use an equivalent genuine replacement or recommend an alternative solution after informing the customer." },
    { title: "9. Battery Replacement", content: "Battery replacement should only be performed by KHRONIQ or an authorized service centre. Improper battery replacement by unauthorized persons may damage the movement, reduce water resistance, or void the warranty." },
    { title: "10. Water Resistance Testing", content: "Where applicable, KHRONIQ may perform a water-resistance test after repairs involving the case, crystal, crown, or case back. Water resistance cannot be guaranteed if the watch has suffered severe impact damage, corrosion, or unauthorized modifications." },
    {
      title: "11. Customer Responsibilities",
      content: (
        <div className="space-y-2">
          <p>Before sending your watch for service, please:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Remove any personal accessories not related to the watch.</li>
            <li>Retain copies of your purchase invoice and warranty card.</li>
            <li>Ensure the watch is securely packaged.</li>
            <li>Provide accurate contact information.</li>
            <li>Clearly describe the issue.</li>
          </ul>
        </div>
      )
    },
    { title: "12. Unclaimed Products", content: "Customers are expected to collect or accept delivery of serviced products promptly after notification. If a repaired watch remains unclaimed for 90 days after written notice, KHRONIQ reserves the right, subject to applicable law, to charge reasonable storage fees or take appropriate action to recover unpaid service costs." },
    {
      title: "13. Limitation of Liability",
      content: (
        <div className="space-y-2">
          <p>KHRONIQ shall not be liable for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Loss of business or profits.</li>
            <li>Indirect or consequential damages.</li>
            <li>Delays caused by courier partners.</li>
            <li>Delays due to spare part shortages.</li>
            <li>Damage resulting from prior unauthorized repairs.</li>
            <li>Issues arising from counterfeit or non-genuine products.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted">KHRONIQ's total liability shall not exceed the actual amount paid by the customer for the specific repair or, where applicable, the purchase price of the product, except where liability cannot be limited under applicable law.</p>
        </div>
      )
    },
    { title: "14. Force Majeure", content: "KHRONIQ shall not be responsible for delays in repair or servicing due to events beyond its reasonable control, including pandemics, floods, earthquakes, fires, natural disasters, government restrictions, curfews, wars, labour strikes, customs delays, transport disruptions, internet outages, or cyber incidents." },
    { title: "15. Policy Modifications", content: "KHRONIQ reserves the right to amend, modify, or update this Repair & Service Policy at any time without prior notice. The latest version will always be available on the Website." },
    { title: "16. Governing Law & Jurisdiction", content: "This Policy shall be governed by the laws of India. Any dispute arising out of or relating to this Policy shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law." },
    {
      title: "17. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
            <p><span className="font-semibold text-luxury-text">Registered Office:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];
  const communityData = [
  {
    title: "1. Company Information",
    content: (
      <div className="space-y-2">
        <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
        <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
        <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
        <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
          Office No. - 2, Chamber - 4,<br />
          Udaigiri Tower, Kaushambi,<br />
          Ghaziabad, Uttar Pradesh — 201010,<br />
          India
        </p>
        <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
        <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
      </div>
    )
  },
  {
    title: "2. Our Community Values",
    content: (
      <div className="space-y-2">
        <p>KHRONIQ encourages a community built on:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Respect</li>
          <li>Honesty</li>
          <li>Authenticity</li>
          <li>Professionalism</li>
          <li>Creativity</li>
          <li>Inclusivity</li>
          <li>Responsible communication</li>
        </ul>
        <p className="text-[11px] text-luxury-muted">We welcome constructive discussions and genuine feedback from our customers and community members.</p>
      </div>
    )
  },
  {
    title: "3. Respectful Conduct",
    content: (
      <div className="space-y-2">
        <p>While interacting on KHRONIQ platforms, you agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Treat others with courtesy and respect.</li>
          <li>Use polite and appropriate language.</li>
          <li>Respect differing opinions.</li>
          <li>Avoid personal attacks or harassment.</li>
          <li>Engage in constructive discussions.</li>
        </ul>
      </div>
    )
  },
  {
    title: "4. Prohibited Content",
    content: (
      <div className="space-y-2">
        <p>The following content is strictly prohibited:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Hate speech or discriminatory remarks.</li>
          <li>Abusive, threatening, or offensive language.</li>
          <li>Harassment or bullying.</li>
          <li>Defamatory or false statements.</li>
          <li>Obscene, vulgar, or sexually explicit content.</li>
          <li>Violent or graphic material.</li>
          <li>Illegal or unlawful content.</li>
          <li>Spam, scams, phishing attempts, or fraudulent activities.</li>
          <li>Malware, viruses, or malicious links.</li>
          <li>Impersonation of any individual or organization.</li>
          <li>Promotion of counterfeit KHRONIQ products.</li>
          <li>Unauthorized advertisements or promotional posts.</li>
          <li>Content that infringes the rights of others.</li>
        </ul>
      </div>
    )
  },
  {
    title: "5. Product Reviews",
    content: (
      <div className="space-y-2">
        <p>We encourage honest product reviews based on genuine customer experiences. Reviews must:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Be truthful.</li>
          <li>Be based on actual use of the product.</li>
          <li>Remain respectful.</li>
          <li>Avoid misleading or false information.</li>
        </ul>
        <p className="text-[11px] text-luxury-muted">KHRONIQ reserves the right to remove fake, abusive, promotional, or irrelevant reviews.</p>
      </div>
    )
  },
  {
    title: "6. User-Generated Content",
    content: (
      <div className="space-y-2">
        <p>By voluntarily submitting photographs, videos, reviews, testimonials, comments, or other content to KHRONIQ, you grant KHRONIQ a non-exclusive, worldwide, royalty-free license to use, reproduce, publish, display, adapt, and promote such content for marketing, promotional, and business purposes, unless otherwise agreed in writing.</p>
        <p>You confirm that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You own or have permission to share the content.</li>
          <li>The content does not infringe the intellectual property rights or privacy rights of others.</li>
          <li>The content complies with applicable laws.</li>
        </ul>
      </div>
    )
  },
  {
    title: "7. Intellectual Property",
    content: (
      <div className="space-y-2">
        <p>Users must respect the intellectual property rights of KHRONIQ and third parties. Without prior written permission, you may not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Copy or reproduce the KHRONIQ logo.</li>
          <li>Use KHRONIQ trademarks or branding for commercial purposes.</li>
          <li>Replicate watch designs or product images.</li>
          <li>Use official product photographs or marketing materials in a misleading manner.</li>
        </ul>
      </div>
    )
  },
  {
    title: "8. Social Media Engagement",
    content: (
      <div className="space-y-2">
        <p>We welcome interaction across our official social media platforms. However, users must not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Post misleading information.</li>
          <li>Spread rumours or misinformation.</li>
          <li>Tag KHRONIQ in inappropriate or unlawful content.</li>
          <li>Misrepresent themselves as employees, representatives, or authorized dealers of KHRONIQ.</li>
        </ul>
      </div>
    )
  },
  {
    title: "9. Privacy of Others",
    content: (
      <div className="space-y-2">
        <p>Please respect the privacy of others. Do not post or share:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Personal addresses.</li>
          <li>Phone numbers.</li>
          <li>Email addresses.</li>
          <li>Payment information.</li>
          <li>Government-issued identification.</li>
          <li>Confidential or sensitive information belonging to another person without their consent.</li>
        </ul>
      </div>
    )
  },
  { title: "10. Reporting Abuse", content: "If you encounter content that violates these Guidelines, please report it to KHRONIQ through our official customer support channels. We will review reported content and take appropriate action where necessary." },
  {
    title: "11. Moderation Rights",
    content: (
      <div className="space-y-2">
        <p>KHRONIQ reserves the right, at its sole discretion, to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Edit, hide, or remove content.</li>
          <li>Restrict or suspend user participation.</li>
          <li>Delete comments or reviews that violate these Guidelines.</li>
          <li>Block accounts engaging in repeated violations.</li>
          <li>Report unlawful activities to appropriate authorities.</li>
        </ul>
        <p className="text-[11px] text-luxury-muted">Moderation decisions are made to maintain a safe and respectful community.</p>
      </div>
    )
  },
  { title: "12. No Endorsement", content: "Opinions expressed by users, customers, or community members do not necessarily reflect the views of KHRONIQ or True Knock Industries Private Limited. KHRONIQ is not responsible for user-generated opinions or comments posted by third parties." },
  {
    title: "13. Violations",
    content: (
      <div className="space-y-2">
        <p>Violation of these Community Guidelines may result in one or more of the following actions:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Warning to the user.</li>
          <li>Removal of content.</li>
          <li>Temporary suspension of access.</li>
          <li>Permanent ban from KHRONIQ community platforms.</li>
          <li>Cancellation of promotional participation.</li>
          <li>Legal action where appropriate.</li>
        </ul>
      </div>
    )
  },
  { title: "14. Changes to These Guidelines", content: "KHRONIQ reserves the right to amend or update these Community Guidelines at any time without prior notice. The latest version will always be available on our Website. Continued participation in our community after changes become effective constitutes acceptance of the revised Guidelines." },
  { title: "15. Governing Law & Jurisdiction", content: "These Community Guidelines shall be governed by and interpreted in accordance with the laws of India. Any dispute arising out of or relating to these Guidelines shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law." },
  {
    title: "16. Contact Us",
    content: (
      <div className="space-y-2">
        <p className="font-bold text-luxury-text">KHRONIQ</p>
        <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
        <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
          <p><span className="font-semibold text-luxury-text">Registered Office:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
          <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      </div>
    )
  }
];
  const disclaimerData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      )
    },
    {
      title: "2. General Information",
      content: "The information provided on this Website is intended for general informational and commercial purposes only. While KHRONIQ makes reasonable efforts to ensure that the information on this Website is accurate and up to date, we do not guarantee that all content is complete, current, accurate, or free from errors."
    },
    {
      title: "3. Product Information",
      content: (
        <div className="space-y-2">
          <p>KHRONIQ strives to accurately display product specifications, descriptions, dimensions, colours, finishes, and images. However:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Product colours may vary depending on screen settings and lighting.</li>
            <li>Natural leather straps may display variations in grain, texture, and colour.</li>
            <li>Minor differences in finishing, polishing, or appearance may occur due to manufacturing processes.</li>
            <li>Product packaging may change without prior notice.</li>
            <li>Product specifications may be updated to improve quality or performance.</li>
          </ul>
          <p className="text-[11px] text-luxury-muted font-semibold mt-1">Such variations shall not be considered manufacturing defects.</p>
        </div>
      )
    },
    {
      title: "4. Watch Accuracy Disclaimer",
      content: "Quartz and other watch movements may exhibit minor variations in timekeeping within industry-accepted tolerances. Such normal deviations do not constitute manufacturing defects."
    },
    {
      title: "5. Water Resistance Disclaimer",
      content: (
        <div className="space-y-2">
          <p>Water resistance ratings indicate laboratory-tested performance under controlled conditions. Water resistance is not permanent and may decrease over time due to normal wear and tear, aging of seals and gaskets, accidental impacts, improper handling, or unauthorized servicing.</p>
          <p>Customers should always follow the water-resistance instructions provided with the product. KHRONIQ shall not be responsible for damage resulting from improper use beyond the specified water-resistance rating.</p>
        </div>
      )
    },
    {
      title: "6. Warranty Disclaimer",
      content: "Warranty coverage is governed exclusively by the KHRONIQ Warranty Policy. This Disclaimer does not extend, modify, or replace any warranty offered by KHRONIQ."
    },
    {
      title: "7. Pricing Disclaimer",
      content: "Prices displayed on the Website are subject to change without prior notice. Despite our best efforts, pricing or typographical errors may occasionally occur. KHRONIQ reserves the right to cancel or refuse any order resulting from incorrect pricing, product descriptions, or technical errors."
    },
    {
      title: "8. Website Availability",
      content: "KHRONIQ does not guarantee uninterrupted or error-free operation of this Website. The Website may be temporarily unavailable due to scheduled maintenance, software updates, technical issues, internet outages, cybersecurity measures, or circumstances beyond our reasonable control."
    },
    {
      title: "9. Third-Party Links",
      content: "This Website may contain links to third-party websites or services. KHRONIQ does not control, endorse, or assume responsibility for the content, products, services, privacy practices, or policies of any third-party website. Users access such websites at their own risk."
    },
    {
      title: "10. Intellectual Property",
      content: "All Website content, including but not limited to: KHRONIQ name, logos, product designs, watch dial designs, photographs, videos, graphics, packaging, product descriptions, QR Codes, model numbers, serial number systems, website design, software, and marketing materials, is the exclusive property of True Knock Industries Private Limited and is protected by applicable intellectual property laws. Unauthorized use, reproduction, distribution, modification, or commercial exploitation is strictly prohibited."
    },
    {
      title: "11. Product Authenticity",
      content: "Only products purchased directly from KHRONIQ or its authorized dealers are guaranteed to be genuine. KHRONIQ is not responsible for counterfeit, altered, refurbished, or unauthorized products purchased from third parties. Customers are encouraged to verify authenticity using official serial numbers or QR codes, where applicable."
    },
    {
      title: "12. Limitation of Liability",
      content: "To the fullest extent permitted by applicable law, KHRONIQ shall not be liable for indirect, incidental, special, or consequential damages; loss of profits, business opportunities, goodwill, reputation, or data; delay in delivery caused by courier partners; website interruptions; technical failures; customer misuse of products; or unauthorized repairs or modifications. KHRONIQ's total liability shall not exceed the purchase price actually paid for the product giving rise to the claim."
    },
    {
      title: "13. User Responsibility",
      content: "Users are responsible for providing accurate information, maintaining account security, reviewing product specifications before purchase, following product care instructions, and using products in accordance with the User Manual and Warranty Policy. Improper use of products may void applicable warranty coverage."
    },
    {
      title: "14. Force Majeure",
      content: "KHRONIQ shall not be liable for any delay or failure in performing its obligations due to events beyond its reasonable control, including but not limited to: pandemics, epidemics, floods, earthquakes, fires, natural disasters, government restrictions, curfews, transport disruptions, customs delays, power failures, internet outages, cyber incidents, war, terrorism, civil unrest, labour strikes, or lockouts."
    },
    {
      title: "15. Changes to This Disclaimer",
      content: "KHRONIQ reserves the right to amend or update this Disclaimer at any time without prior notice. The latest version shall always be available on the Website. Continued use of the Website constitutes acceptance of the revised Disclaimer."
    },
    {
      title: "16. Governing Law & Jurisdiction",
      content: "This Disclaimer shall be governed by and interpreted in accordance with the laws of India. Any dispute arising out of or relating to this Disclaimer shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh, unless otherwise required by applicable law."
    },
    {
      title: "17. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ</p>
          <p>A Premium Watch Brand by True Knock Industries Private Limited</p>
          <div className="pl-3 border-l border-luxury-gold-dark/30 text-[11px] text-luxury-muted space-y-0.5">
            <p><span className="font-semibold text-luxury-text">Registered Office:</span> OFFICE NO. - 2, CHAMBER - 4, UDAIGIRI TOWER, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH — 201010, India</p>
            <p><span className="font-semibold text-luxury-text">Website:</span> www.khroniq.com</p>
            <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
          </div>
        </div>
      )
    }
  ];

  const cookieData = [
    {
      title: "1. Company Information",
      content: (
        <div className="space-y-2">
          <p><span className="font-semibold text-luxury-text">Brand:</span> KHRONIQ</p>
          <p><span className="font-semibold text-luxury-text">Owned & Marketed By:</span> True Knock Industries Private Limited</p>
          <p className="font-semibold text-luxury-text mt-1">Registered Office:</p>
          <p className="pl-3 border-l border-luxury-gold-dark/30 italic text-[11px] text-luxury-muted">
            Office No. - 2, Chamber - 4,<br />
            Udaigiri Tower, Kaushambi,<br />
            Ghaziabad, Uttar Pradesh — 201010,<br />
            India
          </p>
          <p><span className="font-semibold text-luxury-text">Website:</span> <a href="https://www.khroniq.com" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-dark hover:underline">www.khroniq.com</a></p>
          <p><span className="font-semibold text-luxury-text">Email:</span> support@khroniq.com</p>
        </div>
      )
    },
    {
      title: "2. What are Cookies?",
      content: "Cookies are small text files stored on your computer, smartphone, tablet, or other device when you visit a website. Cookies help websites recognize your device, remember your preferences, improve website performance, and provide a better browsing experience. Cookies do not normally contain information that directly identifies you; however, they may be associated with information you voluntarily provide to us."
    },
    {
      title: "3. Types of Cookies We Use",
      content: (
        <div className="space-y-2">
          <p><strong>A. Essential Cookies:</strong> Necessary for the operation of our Website. They enable secure browsing, maintain sessions, and process carts.</p>
          <p><strong>B. Performance & Analytics Cookies:</strong> Collect anonymous info to help us understand visitor behavior and improve the user experience.</p>
          <p><strong>C. Functional Cookies:</strong> Remember your settings, preferences (e.g. language, currency, currency conversion), and saved cart.</p>
          <p><strong>D. Marketing & Advertising Cookies:</strong> Deliver relevant advertisements and measure campaign performance.</p>
          <p><strong>E. Third-Party Cookies:</strong> Set by external services like payment gateways, video hosts, or analytics tools.</p>
        </div>
      )
    },
    {
      title: "4. How We Use Cookies",
      content: "Cookies are utilized to improve Website functionality, analyze performance, prevent fraudulent activities, secure transactions, and customize content and promotions."
    },
    {
      title: "5. Managing Cookies",
      content: "Most web browsers allow you to view, delete, or block cookies. Disabling cookies may affect the functionality of certain areas of the Website, including account logins and checkouts."
    },
    {
      title: "6. Third-Party Services",
      content: "KHRONIQ relies on trusted third-party service providers (like payment processors and shipping partners) who may place cookies on your device in accordance with their privacy policies."
    },
    {
      title: "7. Data Protection",
      content: "Information collected via cookies is governed by the KHRONIQ Privacy Policy and applicable data protection laws, protected under technical and administrative safeguards."
    },
    {
      title: "8. Policy Updates",
      content: "KHRONIQ reserves the right to amend or update this Cookie Policy at any time. The latest version will always be published on the Website."
    },
    {
      title: "9. Governing Law & Jurisdiction",
      content: "This Cookie Policy is governed by Indian law. Any disputes shall be subject to the exclusive jurisdiction of the competent courts at Lucknow, Uttar Pradesh."
    },
    {
      title: "10. Contact Us",
      content: (
        <div className="space-y-2">
          <p className="font-bold text-luxury-text">KHRONIQ Customer Support</p>
          <p>Email: support@khroniq.com</p>
          <p>Registered Office: True Knock Industries Private Limited, Office No. - 2, Chamber - 4, Udaigiri Tower, Kaushambi, Ghaziabad, Uttar Pradesh — 201010, India</p>
        </div>
      )
    }
  ];
  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="border-b border-luxury-text/10 pb-6 text-center max-w-xl mx-auto space-y-2">
        <span className="text-[10px] text-luxury-gold-dark font-bold tracking-widest uppercase">Client Services</span>
        <h1 className="font-serif text-3xl font-bold uppercase tracking-wider text-luxury-text">Khroniq Concierge</h1>
        <div className="w-12 h-[2px] bg-luxury-gold-dark mx-auto mt-3" />
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center border-b border-luxury-text/10 max-w-4xl mx-auto gap-y-1">
        {[
          { key: 'about', label: 'Our Story' },
          { key: 'contact', label: 'Boutique Contact' },
          { key: 'shipping', label: 'Shipping Policy' },
         { key: 'exchange', label: 'Replacement Policy' },
          { key: 'refund', label: 'Refund Policy' },
          { key: 'warranty', label: 'Warranty Policy' },
          { key: 'privacy', label: 'Privacy Policy' },
          { key: 'cod', label: 'COD Policy' },
          { key: 'gifting', label: 'Gifting Policy' },
          { key: 'repair', label: 'Repair & Service' },
          { key: 'community', label: 'Community Guidelines' },
          { key: 'faq', label: 'Client FAQ' },
          { key: 'blogs', label: 'Blogs & Editorial' },
          { key: 'policies', label: 'Legal Policies' },
          { key: 'disclaimer', label: 'Disclaimer' },
          { key: 'cookie', label: 'Cookie Policy' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-4 sm:px-8 text-[11px] font-bold tracking-widest uppercase border-b-2 cursor-pointer transition ${
              activeTab === tab.key 
                ? 'border-luxury-gold-dark text-luxury-gold-dark font-extrabold' 
                : 'border-transparent text-luxury-muted hover:text-luxury-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Render */}
      <div className="max-w-4xl mx-auto bg-white border border-luxury-text/5 rounded-md p-6 sm:p-10 shadow-sm min-h-[400px]">
        
        {/* OUR STORY TAB */}
        {activeTab === 'about' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[9px] text-luxury-gold-dark font-bold tracking-widest uppercase">LAUNCH EDITION</span>
                <h2 className="text-2xl font-serif font-bold text-luxury-text uppercase">The Dawn of Modern Indian Luxury</h2>
                <p className="text-luxury-muted text-xs leading-relaxed font-light">
                  Khroniq was born from a bold vision: to establish a world-class luxury horology house in India. Merging traditional styling with cutting-edge micro-engineering, we design timepieces that redefine elegance and stand as a symbol of modern Indian precision.
                </p>
                <p className="text-luxury-muted text-xs leading-relaxed font-light">
                  From our state-of-the-art assembly headquarters, our designers and engineers push technical limits. We craft robust calibers and elegant designs tailored for individuals who demand sophistication, reliability, and distinction.
                </p>
              </div>
              <div className="h-64 bg-luxury-bg border border-luxury-text/10 rounded flex items-center justify-center p-6 relative overflow-hidden">
                <Compass className="absolute text-luxury-gold-dark/5 w-80 h-80 -right-20 -bottom-20 rotate-12" />
                <img
                  src="/assets/media__1782899491320.jpg"
                  alt="Swiss manufacture"
                  className="max-h-full max-w-full object-contain relative z-10 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
                />
              </div>
            </div>

            <div className="border-t border-luxury-text/10 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <Award className="mx-auto text-luxury-gold-dark" size={24} />
                <h4 className="text-xs font-bold text-luxury-text uppercase tracking-wider">PRESTIGE DESIGN</h4>
                <p className="text-[11px] text-luxury-muted leading-relaxed font-light">Every caliber is meticulously engineered and assembled by master craftsmen at our state-of-the-art facilities.</p>
              </div>
              <div className="space-y-2">
                <Compass className="mx-auto text-luxury-gold-dark" size={24} />
                <h4 className="text-xs font-bold text-luxury-text uppercase tracking-wider">HOROLOGICAL SPEED</h4>
                <p className="text-[11px] text-luxury-muted leading-relaxed font-light">High-frequency movements vibrating at 36,000 VpH, enabling 1/10th of a second precision.</p>
              </div>
              <div className="space-y-2">
                <CheckCircle2 className="mx-auto text-luxury-gold-dark" size={24} />
                <h4 className="text-xs font-bold text-luxury-text uppercase tracking-wider">CHRONOMETER PRIZES</h4>
                <p className="text-[11px] text-luxury-muted leading-relaxed font-light">Over 2,300 first-place chronometry awards secured since foundation.</p>
              </div>
            </div>
          </div>
        )}

        {/* BOUTIQUE CONTACT TAB */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Form */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">concierge Inquiry</h3>
              {contactSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded flex items-center space-x-2">
                  <CheckCircle2 size={16} />
                  <span>Your message has been safely received. A concierge will reply within 12 hours.</span>
                </div>
              )}
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-luxury-muted font-bold uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Georges Favre"
                      className="w-full bg-luxury-bg border border-luxury-text/10 rounded text-luxury-text text-xs p-3 focus:outline-none focus:border-luxury-gold-dark"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-luxury-muted font-bold uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="georges@locle.ch"
                      className="w-full bg-luxury-bg border border-luxury-text/10 rounded text-luxury-text text-xs p-3 focus:outline-none focus:border-luxury-gold-dark"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-luxury-muted font-bold uppercase tracking-widest">Subject</label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="Boutique Appointment Inquiry"
                    className="w-full bg-luxury-bg border border-luxury-text/10 rounded text-luxury-text text-xs p-3 focus:outline-none focus:border-luxury-gold-dark"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-luxury-muted font-bold uppercase tracking-widest">Inquiry Details</label>
                  <textarea
                    required
                    rows="4"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Detail your inquiry regarding custom engravings, custom straps or private concierge bookings..."
                    className="w-full bg-luxury-bg border border-luxury-text/10 rounded text-luxury-text text-xs p-3 focus:outline-none focus:border-luxury-gold-dark"
                  />
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 bg-luxury-gold-dark text-white text-xs font-bold tracking-widest uppercase hover:bg-luxury-gold transition cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Info */}
            <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-luxury-text/10 lg:pl-10">
              <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Boutique HQ</h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-start space-x-3">
                  <MapPin size={16} className="text-luxury-gold-dark mt-0.5" />
                  <div>
                    <h5 className="font-bold text-luxury-text uppercase">La Manufacture Khroniq</h5>
                    <p className="text-luxury-muted font-light leading-relaxed">Rue des Billodes 34,<br />2400 Le Locle, Switzerland</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone size={16} className="text-luxury-gold-dark mt-0.5" />
                  <div>
                    <h5 className="font-bold text-luxury-text uppercase">Concierge Desk</h5>
                    <p className="text-luxury-muted font-light">+41 (0) 32 930 65 00</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail size={16} className="text-luxury-gold-dark mt-0.5" />
                  <div>
                    <h5 className="font-bold text-luxury-text uppercase">Boutique Email</h5>
                    <p className="text-luxury-muted font-light">concierge@khroniq-watches.com</p>
                  </div>
                </div>
              </div>

              <div className="border border-luxury-text/10 rounded p-4 bg-luxury-bg text-center space-y-2">
                <Award className="mx-auto text-luxury-gold-dark" size={20} />
                <h5 className="text-[10px] font-bold text-luxury-text uppercase tracking-widest">Boutique Appointments</h5>
                <p className="text-[10px] text-luxury-muted leading-relaxed font-light">
                  Reserve a personalized viewing session at our international salons located in Paris, Geneva, Tokyo, and New York.
                </p>
              </div>
            </div>
          </div>
        )}

       {/* SHIPPING POLICY TAB */}
{activeTab === 'shipping' && (
  <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
    <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Shipping Policy</h3>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
      <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
        <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
        {shippingData.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              const element = document.getElementById(`shipping-section-${idx}`);
              if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
        <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
        <p className="text-[11px] text-luxury-muted mb-4">
          This Shipping Policy explains how KHRONIQ processes, dispatches, ships, and delivers orders placed through our Website.
        </p>
        {shippingData.map((item, idx) => (
          <section key={idx} id={`shipping-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
            <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
            <div className="text-[11px] font-light text-luxury-muted leading-relaxed">{item.content}</div>
          </section>
        ))}
      </div>
    </div>
  </div>
)}



       {/* REPLACEMENT POLICY TAB */}
{activeTab === 'exchange' && (
  <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
    <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Replacement Policy</h3>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
      <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
        <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
        {replacementData.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              const element = document.getElementById(`replacement-section-${idx}`);
              if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
        <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
        <p className="text-[11px] text-luxury-muted mb-4">
          This Replacement Policy explains the circumstances under which products purchased through our Website are eligible for replacement.
        </p>
        {replacementData.map((item, idx) => (
          <section key={idx} id={`replacement-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
            <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
            <div className="text-[11px] font-light text-luxury-muted leading-relaxed">{item.content}</div>
          </section>
        ))}
      </div>
    </div>
  </div>
)}
      {/* REFUND POLICY TAB */}
{activeTab === 'refund' && (
  <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
    <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Return & Refund Policy</h3>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
      <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
        <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
        {refundData.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              const element = document.getElementById(`refund-section-${idx}`);
              if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
        <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
        <p className="text-[11px] text-luxury-muted mb-4">
          This Return & Refund Policy explains the terms under which products purchased through our Website may be returned or refunded.
        </p>
        {refundData.map((item, idx) => (
          <section key={idx} id={`refund-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
            <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
            <div className="text-[11px] font-light text-luxury-muted leading-relaxed">{item.content}</div>
          </section>
        ))}
      </div>
    </div>
  </div>
)}


        {/* WARRANTY POLICY TAB */}
        {activeTab === 'warranty' && (
          <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Warranty Policy</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              {/* Sticky Sidebar Table of Contents */}
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
                <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
                {warrantyData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const element = document.getElementById(`warranty-section-${idx}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* Scrollable Policy Text */}
              <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
                <p className="text-[11px] text-luxury-muted mb-4">
                  Welcome to KHRONIQ. Every KHRONIQ timepiece is carefully inspected and tested before dispatch. This Warranty Policy explains the scope of warranty coverage, eligibility, exclusions, and the procedure for obtaining warranty service.
                </p>
                {warrantyData.map((item, idx) => (
                  <section key={idx} id={`warranty-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
                    <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
                    <div className="text-[11px] font-light text-luxury-muted leading-relaxed">
                      {item.content}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRIVACY POLICY TAB */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Privacy Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
                <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
                {privacyData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const element = document.getElementById(`privacy-section-${idx}`);
                      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
              <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
                <p className="text-[11px] text-luxury-muted mb-4">
                  This Privacy Policy explains how KHRONIQ collects, uses, shares, and protects your personal information when you use our Website and services.
                </p>
                {privacyData.map((item, idx) => (
                  <section key={idx} id={`privacy-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
                    <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
                    <div className="text-[11px] font-light text-luxury-muted leading-relaxed">{item.content}</div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COD POLICY TAB */}
        {activeTab === 'cod' && (
          <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Cash on Delivery (COD) Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
                <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
                {codData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const element = document.getElementById(`cod-section-${idx}`);
                      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
              <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
                <p className="text-[11px] text-luxury-muted mb-4">
                  At present, Cash on Delivery (COD) is not available for any orders placed through our Website. This Policy explains our payment terms regarding COD.
                </p>
                {codData.map((item, idx) => (
                  <section key={idx} id={`cod-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
                    <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
                    <div className="text-[11px] font-light text-luxury-muted leading-relaxed">{item.content}</div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GIFTING POLICY TAB */}
        {activeTab === 'gifting' && (
          <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Gifting Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
                <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
                {giftingData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const element = document.getElementById(`gifting-section-${idx}`);
                      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
              <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
                <p className="text-[11px] text-luxury-muted mb-4">
                  This Gifting Policy explains the terms applicable to watches and accessories purchased as gifts through our Website.
                </p>
                {giftingData.map((item, idx) => (
                  <section key={idx} id={`gifting-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
                    <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
                    <div className="text-[11px] font-light text-luxury-muted leading-relaxed">{item.content}</div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REPAIR & SERVICE POLICY TAB */}
        {activeTab === 'repair' && (
          <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Repair & Service Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
                <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
                {repairServiceData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const element = document.getElementById(`repair-section-${idx}`);
                      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
              <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
                <p className="text-[11px] text-luxury-muted mb-4">
                  This Repair & Service Policy outlines the terms governing inspection, servicing, repair, maintenance, and replacement of KHRONIQ watches.
                </p>
                {repairServiceData.map((item, idx) => (
                  <section key={idx} id={`repair-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
                    <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
                    <div className="text-[11px] font-light text-luxury-muted leading-relaxed">{item.content}</div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}
         {/* COMMUNITY GUIDELINES TAB */}
{activeTab === 'community' && (
  <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
    <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Community Guidelines</h3>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
      <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
        <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
        {communityData.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              const element = document.getElementById(`community-section-${idx}`);
              if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
        <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
        <p className="text-[11px] text-luxury-muted mb-4">
          Welcome to KHRONIQ. These Community Guidelines are intended to ensure that our online platforms remain respectful, safe, and enjoyable for all members of the KHRONIQ community. They apply to our Website, social media pages, customer reviews, forums, events, contests, and any other official KHRONIQ platforms.
        </p>
        {communityData.map((item, idx) => (
          <section key={idx} id={`community-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
            <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
            <div className="text-[11px] font-light text-luxury-muted leading-relaxed">{item.content}</div>
          </section>
        ))}
      </div>
    </div>
  </div>
  )}       
        {/* CLIENT FAQ TAB */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {faqData.map((faq, idx) => (
                <div key={idx} className="border border-luxury-text/10 rounded overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left bg-luxury-bg/30 hover:bg-luxury-bg/60 transition duration-200 cursor-pointer text-xs font-bold uppercase tracking-wider text-luxury-text"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={14} className={`text-luxury-gold-dark transform transition-transform duration-200 ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedFaq === idx && (
                    <div className="p-4 bg-white text-xs text-luxury-muted leading-relaxed font-light border-t border-luxury-text/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOGS & EDITORIAL TAB */}
        {activeTab === 'blogs' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Blogs & Editorial</h3>
            
            {blogs.length === 0 ? (
              <p className="text-luxury-muted text-xs italic text-center p-6 border border-dashed border-luxury-text/10 rounded">No editorial posts available at this time.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogs.map((blog) => (
                  <div key={blog.id || blog._id} className="group border border-luxury-text/10 hover:border-luxury-gold-dark/40 rounded overflow-hidden flex flex-col bg-luxury-bg/5 transition duration-300">
                    <div className="h-44 overflow-hidden relative bg-black">
                      <img 
                        src={blog.image || '/assets/media__1782899491225.jpg'} 
                        alt={blog.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-bold text-luxury-gold-dark uppercase tracking-wider">
                          <span>{blog.category}</span>
                          <span className="text-luxury-muted/70">{blog.date}</span>
                        </div>
                        <h4 className="text-luxury-text font-serif font-bold text-base leading-snug group-hover:text-luxury-gold-dark transition">{blog.title}</h4>
                        <p className="text-luxury-muted text-[11px] font-light leading-relaxed line-clamp-3">{blog.content}</p>
                      </div>
                      <button
                        onClick={() => setSelectedBlog(blog)}
                        className="text-[10px] font-bold text-luxury-gold-dark hover:text-luxury-text transition tracking-widest uppercase flex items-center gap-1 cursor-pointer self-start"
                      >
                        Read Article <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Read Blog Overlay Modal */}
            {selectedBlog && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white border border-luxury-text/10 p-6 sm:p-8 rounded-md w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
                  <button 
                    onClick={() => setSelectedBlog(null)} 
                    className="absolute top-4 right-4 text-luxury-muted hover:text-luxury-text p-1 cursor-pointer transition"
                  >
                    <X size={20} />
                  </button>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-luxury-gold-dark uppercase tracking-widest">
                      <span>{selectedBlog.category}</span>
                      <span>·</span>
                      <span className="text-luxury-muted/70">By {selectedBlog.author}</span>
                      <span>·</span>
                      <span className="text-luxury-muted/70">{selectedBlog.date}</span>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-text leading-tight">{selectedBlog.title}</h2>
                    <div className="w-12 h-[2px] bg-luxury-gold-dark mt-2" />

                    {selectedBlog.image && (
                      <div className="h-64 sm:h-80 w-full overflow-hidden rounded bg-black">
                        <img 
                          src={selectedBlog.image} 
                          alt={selectedBlog.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-luxury-muted text-xs leading-relaxed font-light whitespace-pre-wrap pt-2 font-sans">
                      {selectedBlog.content}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEGAL POLICIES TAB */}
        {activeTab === 'policies' && (
          <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Terms, Privacy & Policies</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              {/* Sticky Sidebar Table of Contents */}
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
                <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
                {policiesData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const element = document.getElementById(`policy-section-${idx}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* Scrollable Policy Text */}
              <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {policiesData.map((item, idx) => (
                  <section key={idx} id={`policy-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
                    <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
                    <div className="text-[11px] font-light text-luxury-muted leading-relaxed">
                      {item.content}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DISCLAIMER TAB */}
        {activeTab === 'disclaimer' && (
          <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Disclaimer</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              {/* Sticky Sidebar Table of Contents */}
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
                <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
                {disclaimerData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const element = document.getElementById(`disclaimer-section-${idx}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* Scrollable Policy Text */}
              <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
                {disclaimerData.map((item, idx) => (
                  <section key={idx} id={`disclaimer-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
                    <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
                    <div className="text-[11px] font-light text-luxury-muted leading-relaxed">
                      {item.content}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COOKIE POLICY TAB */}
        {activeTab === 'cookie' && (
          <div className="space-y-6 text-xs text-luxury-muted leading-relaxed font-light">
            <h3 className="text-lg font-bold text-luxury-text font-serif uppercase tracking-wide">Cookie Policy</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              {/* Sticky Sidebar Table of Contents */}
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2 border-r border-luxury-text/10 sticky top-24 hidden md:block">
                <p className="text-[10px] font-bold text-luxury-text uppercase tracking-widest mb-3">Table of Contents</p>
                {cookieData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const element = document.getElementById(`cookie-section-${idx}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="block text-left w-full text-[10px] py-1.5 px-2 hover:bg-luxury-gold-dark/5 hover:text-luxury-gold-dark transition rounded font-medium truncate cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* Scrollable Policy Text */}
              <div className="md:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <p className="text-[11px] text-luxury-muted italic mb-4">Effective Date: 1st July 2026</p>
                {cookieData.map((item, idx) => (
                  <section key={idx} id={`cookie-section-${idx}`} className="space-y-2 scroll-mt-24 pb-4 border-b border-luxury-text/5 last:border-b-0">
                    <h4 className="font-bold text-luxury-text uppercase text-[10px] tracking-wider">{item.title}</h4>
                    <div className="text-[11px] font-light text-luxury-muted leading-relaxed">
                      {item.content}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
