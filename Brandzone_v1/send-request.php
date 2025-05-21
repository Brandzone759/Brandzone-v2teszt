<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $name = htmlspecialchars($_POST['name']);
    $company = htmlspecialchars($_POST['company']);
    $email = htmlspecialchars($_POST['email']);
    $phone = htmlspecialchars($_POST['phone']);
    $note = htmlspecialchars($_POST['note']);

    $to = "info@brandzone.ro";

    $subject = "Új árajánlat kérés érkezett";

    $message = "Név: $name\n";
    $message .= "Cég: $company\n";
    $message .= "Email: $email\n";
    $message .= "Telefon: $phone\n";
    $message .= "Miben segíthetünk: \n$note\n";


    if (mail($to, $subject, $message)) {
        echo "Sikeresen elküldtük az árajánlatkérést!";
        echo "<meta http-equiv='refresh' content='2;url=index.html'>";
    } else {
        echo "Hiba történt az üzenet küldésekor.";
    }
}
?>